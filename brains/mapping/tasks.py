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
    player = get_player(data['user']['id'], category=goon)
    player.is_dead = not data['user']['alive']
    player.save()


    # Update Christmas tree flag on the location
    position = data['surroundings']['position']
    
    report = Report()
    report.location = location
    report.inside = data['surroundings']['inside']
    report.has_tree = position['christmasTree']
    report.barricade_level = position.get('barricades')
    report.is_ruined = postion['ruined']
    report.is_illuminated = position['illuminated']
    report.zombies_present = position['zombies']
    report.zombies_only = False
    report.reported_by = player
    report.origin = ip
    report.save()
    
    for profile_id in position['survivors']:
        get_player.delay(profile_id, report)
        
    del position['surroundings']['map'][1][1]

    if not report.inside:
        for row in position['surroundings']['map']:
            for col in row:
                location = Location.objects.get(x=col['coords']['x'], y=col['coords']['y'])
                secondary = Report()
                secondary.reported_by = player
                secondary.zombies_present = col['zombies']
                secondary.location = location
                secondary.origin = ip
                secondary.save()


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

