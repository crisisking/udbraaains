from celery.task import task
from namelist.scrape import get_user_profile_id, scrape_profile, NotFound
from namelist.models import Player, Category

@task()
def import_user(profile_name_or_id, category=None, user=None):
    if isinstance(profile_name_or_id, basestring):
        try:
            profile_id = get_user_profile_id(profile_name_or_id)
        except NotFound:
            if user:
                user.message_set.create(message="Couldn't create {0}".format(profile_name_or_id))
            return
    else:
        profile_id = profile_name_or_id
        
    info = scrape_profile(profile_id)

    player, created = Player.objects.get_or_create(profile_id=profile_id)
    if player[1]:
        player[0].category = category
        player[0].name = info[0]
    player[0].group_name = info[1]
    player[0].save()
