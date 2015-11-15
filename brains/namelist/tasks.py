from celery.task import task
from namelist.scrape import scrape_profile
from namelist.models import Player, Category


@task()
def import_user(profile_name_or_id, category=None, user=None, join_date=None):
    try:
        profile_id = int(profile_name_or_id)
    except ValueError:
        if user:
            user.message_set.create(message="Couldn't create {0}".format(profile_name_or_id))
        return

    info = scrape_profile(profile_id)

    player, created = Player.objects.get_or_create(profile_id=profile_id)
    if created:
        player.name = info[0]
        player.join_date = info[2]
    player.group_name = info[1]
    if not player.category:
        player.category = category
    player.save()
