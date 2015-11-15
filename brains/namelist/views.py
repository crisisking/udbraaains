# Create your views here.
import json
from django.http import HttpResponse
from namelist.models import Player
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def process_ids(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    if 'players[]' not in request.POST and 'players' not in request.POST:
        return HttpResponse(status=400)

    player_ids = request.POST.getlist('players[]')
    players = []
    for player_id in player_ids:
        try:
            players.append(int(player_id))
        except ValueError:
            pass

    players = Player.objects.filter(profile_id__in=players)
    players = players.exclude(category=None).select_related()
    data = []
    for player in players:
        color_code = player.category.color_code
        data.append(dict(id=player.profile_id, color_code=color_code))

    return HttpResponse(json.dumps(data), 'application/json')
