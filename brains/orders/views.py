import math
from django.shortcuts import render
from django.template import RequestContext
from orders.models import Order

def index(request, x, y):

    # Fetch the orders
    fresh_order = list(Order.objects.all().order_by('-date'))
    fresh_order.sort(key=lambda o: user_coord_dist(x, y, o.x, o.y)

    # Return orders sorted by distance
    return render('orders/orders.html', { 'orders': fresh_orders })

def user_coord_dist(x1, y1, x2, y2):
    # Pythagoras
    return math.sqrt(math.pow(x2-x1,2)+math.pow(y2-y1,2))

