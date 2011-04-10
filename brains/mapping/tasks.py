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

    location = Location.objects.get(x=coords[0], y=coords[1])
    
    # Grab the player object, update is dead flag
    player = get_player(data['user']['id'], location, category=goon)
    player.is_dead = not data['user']['alive']
    player.save()
    

    # Update Christmas tree flag on the location
    position = data['surroundings']['position']
    location.has_tree = position['christmasTree']
    location.save()
    
    # Pull out barricade info
    barricade_level = position.get('barricades')
    
    # Throw away these keys so we can process the player's position with the other
    # visible positions
    try:
        del position['barricades']
    except KeyError:
        pass
    try:
        del position['christmasTree']
    except KeyError:
        pass

    reports = []
    reports.append(position)
    
    # Flatten the map
    for row in data['surroundings']['map']:
        for cell in row:
            reports.append(cell)
    
    # Process reports
    for record in reports:
        report = Report()
        location = Location.objects.get(x=record['coords']['x'], y=record['coords']['y'])
        location.player_set.clear()
        location.save()
        report.location = location
        report.is_ruined = record['ruined']
        report.is_illuminated = record['illuminated']
        report.barricade_level = barricade_level
        report.origin = ip
        report.reported_by = player
        report.zombies_present = record['zombies']
        report.save()
        barricade_level = None
        
        for obj in record['survivors']:
            try:
                get_player.delay(obj['id'], location)
            except KeyError:
                print obj
                raise


@task()
def get_player(profile_id, location=None, category=None, force_refresh=False):
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
    if location:
        player.location = location
    if category and not player.category:
        player.category = category
    player.save()
    return player

