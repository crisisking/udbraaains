import cPickle as pickle
import datetime
import json

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

import redis

from mapping.tasks import process_data


CONN = redis.Redis(host=settings.BROKER_HOST, port=settings.BROKER_PORT, db=6)


def process_annotation_timestamp(annotation, name_in, age_name, time):
    if name_in in annotation:
        annotation[name_in] = pickle.loads(str(annotation[name_in]))
        try:
            annotation[age_name] = unicode(time - annotation[name_in])
        except TypeError:
            annotation[age_name] = None
        del annotation[name_in]
    else:
        annotation[age_name] = None


@csrf_exempt
def receive_data(request):
    if request.method == 'POST' and 'data' in request.POST:
        data = json.loads(request.POST['data'])
        # Grab the player's position and IP, process data in background
        origin_x = data['surroundings']['position']['coords']['x']
        origin_y = data['surroundings']['position']['coords']['y']

        if origin_x < 0 or origin_x > 99 or origin_y < 0 or origin_y > 99:
            return HttpResponse('STOP IT', status=400)

        if 'HTTP_X_REAL_IP' in request.META:
            ip = request.META['HTTP_X_REAL_IP']
        else:
            ip = request.META['REMOTE_ADDR']
        process_data.delay(data, ip)

        payload = {}
        payload['annotation'] = []
        payload['trees'] = [json.loads(x) for x in CONN.smembers('trees')]

        # Grab all locations in a 15x15 square,
        # centered on the player's position
        x_range = (range(origin_x + 1, origin_x + 8) +
                   range(origin_x, origin_x - 8, -1))
        y_range = (range(origin_y + 1, origin_y + 8) +
                   range(origin_y, origin_y - 8, -1))

        for x in x_range:
            for y in y_range:
                annotation = CONN.get('location:{0}:{1}'.format(x, y))
                if annotation:
                    now = datetime.datetime.now()
                    annotation = json.loads(annotation)
                    process_annotation_timestamp(annotation, 'report_date',
                                                 'report_age', now)
                    process_annotation_timestamp(annotation,
                                                 'inside_report_date',
                                                 'inside_age', now)
                    process_annotation_timestamp(annotation,
                                                 'outside_report_date',
                                                 'outside_age', now)
                    payload['annotation'].append(annotation)

        return HttpResponse(json.dumps(payload),
                            content_type='application/json',
                            status=200)

    return HttpResponse(status=405)


def map_data(request):

    data = []
    for key in CONN.keys('location:*'):
        annotation = json.loads(CONN[key])
        try:
            report_date = pickle.loads(annotation['report_date'])
            now = datetime.datetime.now()
            annotation['report_age'] = unicode(now - report_date)
        except TypeError:
            annotation['report_age'] = None
        del annotation['report_date']
        data.append(annotation)

    return HttpResponse(json.dumps(data),
                        content_type='application/json',
                        status=200)
