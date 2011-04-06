from celery.task import task
from namelist.scrape import get_user_profile_id, scrape_profile
from namelist.models import Player, Category

@task()
def import_user(user, profile_name_or_id, category=None):
    if isinstance(profile_name_or_id, basestring):
        try:
            profile_id = get_user_profile_id(profile_name_or_id)
        except NotFound:
            user.message_set.create(message="Couldn't create {0}".format(profile_name_or_id))
            return
    else:
        profile_id = profile_name_or_id
        
    info = scrape_profile(profile_id)
    print info
    print profile_id
    player = Player.objects.get_or_create(name=info[0], group_name=info[1], profile_id=profile_id)
    if player[1]:
        player[0].category = category
        player[0].save()
