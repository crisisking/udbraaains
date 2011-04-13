import datetime
import json
import math
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from mapping.models import Location, Report
from mapping.tasks import process_data, get_player
from namelist.models import Category, Player
import redis

CONN = redis.Redis(db=6)


@csrf_exempt
def receive_data(request):
    if request.method == 'POST' and request.POST.has_key('data'):
        data = json.loads(request.POST['data'])
        # Grab the player's position and IP, process data in background
        origin_x = data['surroundings']['position']['coords']['x']
        origin_y = data['surroundings']['position']['coords']['y']
        ip = request.META['HTTP_X_REAL_IP']

        process_data.delay(data, ip)

        payload = {}
        payload['annotation'] = []
        payload['trees'] = [json.loads(x) for x in CONN.smembers('trees')]

        # Grab all locations in a 15x15 square, centered on the player's position
        x_range = range(origin_x+1, origin_x+8) + range(origin_x, origin_x-8, -1)
        y_range = range(origin_y+1, origin_y+8) + range(origin_y, origin_y-8, -1)

        for x in x_range:
            for y in y_range:
                annotation = CONN.get('location:{0}:{1}'.format(x, y))
                if annotation:
                    payload['annotation'].append(json.loads(annotation))
        
        
        return HttpResponse(json.dumps(payload), content_type='application/json', status=200)

    return HttpResponse(status=405)

