import json
import datetime
import cPickle as pickle
from celery.task import task
from mapping.models import Report, Location
from namelist.models import Player, Category
from namelist.scrape import scrape_profile
import redis

CONN = redis.Redis(db=6)

@task()
def process_data(data, ip):
    """Processes a data set from the UD plugin for a given IP address."""
    
    
    # Grab the goon category to auto-tag plugin users
    goon = Category.objects.get(name=u'Goon')
    
    # Get coordinates and location of the current player
    coords = (data['surroundings']['position']['coords']['x'], 
                data['surroundings']['position']['coords']['y'])

    try:
        p_location = Location.objects.get(x=coords[0], y=coords[1])
    except Location.DoesNotExist:
        CONN.lpush('location-errors', json.dumps(dict(data=data, ip=ip)))
        raise

    # Grab the player object, update is dead flag. We save right here, so avoid extra save
    player = get_player(data['user']['id'], category=goon, save=False)
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
        try:
            results.append(get_player.delay(profile['id'], report))
        except KeyError:
            print data, ip
            CONN.lpush('errors', json.dumps(dict(data=data, ip=ip)))
            raise
    
    if not report.inside:
        for row in data['surroundings']['map']:
            for col in row:
                location = Location.objects.get(x=col['coords']['x'], y=col['coords']['y'])
                if location == p_location:
                    continue
                secondary = Report()
                secondary.reported_by = player
                secondary.zombies_present = col['zombies']
                secondary.location = location
                secondary.origin = ip
                secondary.save()
                CONN.sadd('rebuild', location.id)

        
    CONN.sadd('rebuild', p_location.id)


@task()
def get_player(profile_id, report=None, category=None, force_refresh=False, save=True):
    profile_id = int(profile_id)
    player, created = Player.objects.get_or_create(profile_id=profile_id)
    if created or force_refresh:
        profile_data = scrape_profile(profile_id)
        player.name = profile_data[0]
        player.group_name = profile_data[1]
        player.join_date = profile_data[2]

    # Scrape player group info every 2 days
    elif datetime.datetime.now() - player.scrape_date > datetime.timedelta(days=2):
        profile_data = scrape_profile(profile_id)
        player.group_name = profile_data[1]
    if report:
        report.players.add(player)
        CONN.sadd('rebuild', report.location_id)
    if category and not player.category:
        player.category = category
    if save:
        player.save()
    return player


@task()
def build_annotation(location):

    CONN.srem('rebuild-scheduled', location.id)
    has_lock = CONN.setnx('update-location:{0}:{1}'.format(location.x, location.y), 1)
    if not has_lock:
        CONN.sadd('rebuild', location.id)
        return "Location [{0}, {1}] locked for update".format(location.x, location.y)
    
    # Expire lock after five minutes, workers usually have twice that long to finish.
    CONN.expire('update-location:{0}:{1}'.format(location.x, location.y), 300)
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


    primaries = reports.filter(zombies_only=False)
    if primaries:
        primary = primaries[0]
        inside = primaries.filter(inside=True)
        outside = primaries.filter(inside=False)

        annotation['barricades'] = primary.barricade_level
        annotation['ruined'] = primary.is_ruined
        annotation['illuminated'] = primary.is_illuminated
    
        annotation['report_date'] = pickle.dumps(primary.reported_date)
        annotation['survivor_count'] = None
    
        if inside:
            inside_report = inside[0]
            annotation['survivor_count'] = inside_report.players.count()
            annotation['inside_report_date'] = pickle.dumps(inside_report.reported_date)
            coords_x = location.x
            coords_y = location.y
            json_coords = json.dumps({'x': coords_x, 'y': coords_y})
            if inside_report.has_tree:
                CONN.sadd('trees', json_coords)
            else:
                CONN.srem('trees', json_coords)
        
        if outside:
            outside_report = outside[0]
            total = annotation['survivor_count'] or 0
            annotation['survivor_count'] = total + outside_report.players.count()
            annotation['outside_report_date'] = pickle.dumps(outside_report.reported_date)
    else:
        for key in ('barricades', 'ruined', 'illuminated', 'survivor_count'):
            annotation[key] = None
        annotation['report_date'] = pickle.dumps(None)

    annotation['x'] = location.x
    annotation['y'] = location.y
    annotation['building_type'] = location.building_type
    CONN['location:{0}:{1}'.format(location.x, location.y)] = json.dumps(annotation)
    del CONN['update-location:{0}:{1}'.format(location.x, location.y)]
    return location


@task()
def annotation_master():
    have_lock = CONN.setnx('updating', 1)
    if not have_lock:
        return "Master annotation lock held"

    # Break the lock in 45 seconds, in case something exceptional happens.
    CONN.expire('updating', 45)
    transaction = CONN.pipeline()
    transaction = transaction.sdiff(['rebuild', 'rebuild-scheduled'])
    del transaction['rebuild']
    transaction = transaction.execute()
    add_transaction = CONN.pipeline()
    for i in transaction[0]:
        add_transaction.sadd('rebuild-scheduled', i)
    add_transaction.execute()
    locations = Location.objects.filter(pk__in=[int(x) for x in transaction[0]])
    for l in locations:
        build_annotation.delay(l)
    del CONN['updating']

