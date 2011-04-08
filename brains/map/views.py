import datetime
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

import redis

REDIS = redis.Redis(db=4)

@csrf_exempt
def receive_data(request):
    if request.method == 'POST' and request.POST.has_key('data'):
        data = {'date': unicode(datetime.datetime.now()), 'payload': request.POST['data']}
        REDIS.lpush(json.dumps(data))
        return HttpResponse(status=200)
    return HttpResponse(status=405)
