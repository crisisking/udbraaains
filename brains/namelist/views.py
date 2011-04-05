# Create your views here.
import json
from django.http import HttpResponse
from namelist.models import Player
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def process_ids(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    
    if not request.POST.has_key('survivors[]') or not request.POST.has_key('survivors'):
        return HttpResponse(status=400)

    survivor_ids = request.POST.getlist('survivors[]')
    survivors = []
    for survivor_id in survivor_ids:
        try:
            survivors.append(int(survivor_id))
        except ValueError:
            pass
    
    survivors = Player.objects.filter(profile_id__in=survivors).select_related()
    data = []
    for survivor in survivors:
        data.append(dict(id=survivor.profile_id, color_code=survivor.category.color_code))
        
    return HttpResponse(json.dumps(data), 'application/json')
