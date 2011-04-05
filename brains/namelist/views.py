# Create your views here.
import json
from django.http import HttpResponse
from namelist.models import Player
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def process_ids(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    
    if not request.POST.has_key('players[]') and not request.POST.has_key('players'):
        return HttpResponse(status=400)

    player_ids = request.POST.getlist('players[]')
    players = []
    for player_id in player_ids:
        try:
            players.append(int(player_id))
        except ValueError:
            pass
    
    players = Player.objects.filter(profile_id__in=players).select_related()
    data = []
    for player in players:
        data.append(dict(id=player.profile_id, color_code=player.category.color_code))
        
    return HttpResponse(json.dumps(data), 'application/json')
