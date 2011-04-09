import datetime
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from mapping.models import Location, Report
from mapping.tasks import process_data
from namelist.models import Category


@csrf_exempt
def receive_data(request):
    if request.method == 'POST' and request.POST.has_key('data'):
        data = json.loads(request.POST['data'])
        # Grab the player's position and IP, process data in background
        origin_x = data['surroundings']['position']['coords']['x']
        origin_y = data['surroundings']['position']['coords']['y']
        ip = request.META['HTTP_X_REAL_IP']
        process_data.delay(data, ip)

        data = []
        
        # Grab all locations in a 15x15 square, centered on the player's position
        x_range = range(origin_x-1, origin_x+15) + range(origin_x, origin_x-15, -1)
        y_range = range(origin_y-1, origin_y+15) + range(origin_y, origin_y-15, -1)
        locations = Location.objects.filter(x__in=x_range, 
                                            y__in=y_range)

        for location in locations:

            annotation = {}
            annotation['x'] = location.x
            annotation['y'] = location.y
            
            # Grab all reports from the last five days
            reports = location.report_set.exclude(reported_date__lte=datetime.datetime.now() - datetime.timedelta(days=5))
            reports = reports.order_by('-reported_date')
            
            # For barricade info, ignore the reports without levels set
            barricades = reports.exclude(barricade_level=None)
            if barricades:
                    annotation['barricades'] = barricades[0].barricade_level
            else:
                annotation['barricades'] = None

            # Grab report stats if they exist
            annotation['player_count'] = location.player_set.count()
            report = location.report_set.order_by('reported_date')
            if report:
                report = report[0]
                annotation['ruined'] = report.is_ruined
                annotation['illuminated'] = report.is_illuminated
                annotation['zombies'] = report.zombies_present
                annotation['report_age'] = unicode(datetime.datetime.now() - report.reported_date)
            else:
                annotation['ruined'] = None
                annotation['illuminated'] = None
                annotation['zombies'] = None
                annotation['report_date'] = None
            data.append(annotation)
            
        # Find all reported Christmas trees for smashing
        christmas_trees = Location.objects.filter(has_tree=True).values('x', 'y').distinct()
        trees = []
        for location in christmas_trees:
            trees.append({'x': location.x, 'y': location.y})

        # Get all priority targets and other worthless players
        priority_targets = Player.objects.exclude(category__name__in=[None, u"Goon"])
        priority_targets = priority_targets.exclude(location=None)
        priority_targets = priority_targets.values_list('location__x', 'location__y', 'name', 'profile_id', 'category__color_code')
        targets = []
        for target in priority_targets:
            targets.append(dict(zip('x', 'y', 'name', 'profile_id', 'color_code'), target))

        return HttpResponse(json.dumps({'annotation': data, 'trees':trees, 'targets':targets }), content_type='application/json', status=200)

    return HttpResponse(status=405)
