import json
import datetime
from celery.task import task
from mapping.models import Report, Location
from namelist.models import Player, Category
from namelist.scrape import scrape_profile
import redis

@task()
def process_data(data, ip):
    """Processes a data set from the UD plugin for a given IP address."""
    
    # Grab the goon category to auto-tag plugin users
    goon = Category.objects.get(name=u'Goon')
    
    # Get coordinates and location of the current player
    coords = (data['surroundings']['position']['coords']['x'], 
                data['surroundings']['position']['coords']['y'])

    p_location = Location.objects.get(x=coords[0], y=coords[1])
    
    # Grab the player object, update is dead flag
    player = get_player(data['user']['id'], category=goon)
    player.is_dead = not data['user']['alive']
    player.save()


    position = data['surroundings']['position']
    
    # Build primary report
    report = Report()
    report.location = p_location
    report.inside = data['surroundings']['inside']
    report.has_tree = position['christmasTree']
    report.barricade_level = position.get('barricades')
    report.is_ruined = position['ruined']
    report.is_illuminated = position['illuminated']
    report.zombies_present = position['zombies']
    report.zombies_only = False
    report.reported_by = player
    report.origin = ip
    report.save()
    
    # Add players to the primary report
    results = []
    for profile in position['survivors']:
        results.append(get_player.delay(profile['id'], report))
    
    # Throw away the middle cell, we've already processed it
    del data['surroundings']['map'][1][1]

    if not report.inside:
        for row in data['surroundings']['map']:
            for col in row:
                location = Location.objects.get(x=col['coords']['x'], y=col['coords']['y'])
                secondary = Report()
                secondary.reported_by = player
                secondary.zombies_present = col['zombies']
                secondary.location = location
                secondary.origin = ip
                secondary.save()
                build_annotation.delay(location)

        
    build_annotation.delay(p_location)


@task()
def get_player(profile_id, report=None, category=None, force_refresh=False):
    profile_id = int(profile_id)
    player, created = Player.objects.get_or_create(profile_id=profile_id)
    if created or force_refresh:
        profile_data = scrape_profile(profile_id)
        player.name = profile_data[0]
        player.group = profile_data[1]
        player.join_date = profile_data[2]

    # Scrape player group info every 14 days
    elif datetime.datetime.now() - player.scrape_date > datetime.timedelta(days=14):
        profile_data = scrape_profile(profile_id)
        player.group = profile_data[1]
    if report:
        report.players.add(player)
    if category and not player.category:
        player.category = category
    player.save()
    return player


@task()
def build_annotation(location):

    conn = redis.Redis(db=6)
    reports = location.report_set.exclude(reported_date__lte=datetime.datetime.now() - datetime.timedelta(days=5))
    reports = reports.order_by('-reported_date')
    annotation = {}
    inside_zombies = reports.filter(inside=True)
    outside_zombies = reports.filter(inside=False)
    annotation['zombies'] = None

    try:
        annotation['zombies'] = inside_zombies[0].zombies_present
    except IndexError:
        pass

    try:
        if annotation['zombies'] is not None:
            annotation['zombies'] += outside_zombies[0].zombies_present
        else:
            annotation['zombies'] = outside_zombies[0].zombies_present
    except IndexError:
        pass
    
    annotation['zombies'] = reports[0].zombies_present if reports else None

    primaries = reports.filter(zombies_only=False)
    if primaries:
        inside = primaries.filter(inside=True)
        outside = primaries.filter(inside=False)
    
        annotation['barricades'] = primaries[0].barricade_level
        annotation['ruined'] = primaries[0].is_ruined
        annotation['illuminated'] = primaries[0].is_illuminated
    
        annotation['report_age'] = unicode(datetime.datetime.now() - primaries[0].reported_date)
        annotation['survivor_count'] = None
    
        if inside:
            report = inside[0]
            annotation['survivor_count'] = report.players.count()
            coords_x = location.x
            coords_y = location.y
            json_coords = json.dumps({'x': coords_x, 'y': coords_y})
            if report.has_tree:
                conn.sadd('trees', json_coords)
            else:
                conn.srem('trees', json_coords)
        
        if outside:
            total = annotation['survivor_count'] or 0
            annotation['survivor_count'] = total + outside[0].players.count()
        
    else:
        for key in ('barricades', 'ruined', 'illuminated', 'report_age', 'survivor_count'):
            annotation[key] = None

    annotation['x'] = location.x
    annotation['y'] = location.y
    conn['location:{0}:{1}'.format(location.x, location.y)] = json.dumps(annotation)
    
    