import json
import datetime
from celery.task import task
from mapping.models import Report, Location
from namelist.models import Player, Category
from namelist.scrape import scrape_profile

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
    barricade_level = position['barricades']
    
    # Throw away these keys so we can process the player's position with the other
    # visible positions
    del position['barricades']
    del position['christmasTree']

    reports = []
    reports.append(position)
    
    # Flatten the map
    for row in data['surroundings']['map']:
        for cell in row:
            reports.append(cell)
    
    # Process reports
    for report in reports:
        report = Report()
        location = Location.objects.get(x=report['coords']['x'], y=report['coords']['y'])
        report.location = location
        report.is_ruined = report['ruined']
        report.is_illuminated = report['illuminated']
        report.barricade_level = barricade_level
        report.origin = ip
        report.reported_by = player
        report.save()
        barricade_level = None
        
        for obj in report['survivors']:
            get_player.delay(obj['id'], location)


@task()
def get_player(profile_id, location, category=None):
    profile_id = int(profile_id)
    player, created = Player.objects.get_or_create(profile_id=profile_id)
    if created:
        profile_data = scrape_profile(profile_id)
        player.name = profile_data[0]
        player.group = profile_data[1]
        player.join_date = profile_data[2]

    # Scrape player group info every 14 days
    elif datetime.datetime.now() - player.scrape_date > datetime.timedelta(days=14):
        profile_data = scrape_profile(profile_id)
        player.group = profile_data[1]
    player.location = location
    if category and not player.category:
        player.category = category
    player.save()
    return player
