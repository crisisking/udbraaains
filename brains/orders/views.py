import math
import re
from django.shortcuts import render
from orders.models import Order

MAP_URL = re.compile(r'^http://(www\.)?urbandead\.com/map\.cgi')


def index(request, x, y):

    referrer = request.META.get('HTTP_REFERER', '')

    if not MAP_URL.search(referrer):
        return render(request, 'orders/orders.html', dict(slamjam=True))

    x = int(x)
    y = int(y)
    # Fetch the orders
    fresh_order = list(Order.objects.all().order_by('-date'))
    fresh_order.sort(key=lambda o: user_coord_dist(x, y, o.x, o.y))

    # Return orders sorted by distance
    return render(request, 'orders/orders.html', dict(orders=fresh_order))


def user_coord_dist(x1, y1, x2, y2):
    # Pythagoras
    return math.sqrt(math.pow(x2 - x1, 2) + math.pow(y2 - y1, 2))
