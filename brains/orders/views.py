from django.shortcuts import render_to_response
from django.template import RequestContext
from orders.models import Order

def index(request):
    # customise response to put closest orders first
    x = request.REQUEST.get("x", 50)
    y = request.REQUEST.get("y", 50)

    # Fetch the newest orders
    fresh_order = Order.objects.all().order_by('-date')[0:6]

    # Add a custom key, based on distance from this user
    fresh_order.dist = user_coord_dist(x, y, fresh_order.x, fresh_order.y)

    # Return top 3 nearest orders
    return render_to_response('orders/orders.html', 
        { 'orders': fresh_order.order_by('-dist')[0:3] },
        context_instance=RequestContext(request)
    )

def user_coord_dist(x1, y1, x2, y2):
    # Pythagoras
    return dist = math.sqrt(math.pow(x2-x1,2)+math.pow(y2-y1,2))

    #x   = models.IntegerField(default=50)
    #y = models.IntegerField(default=50)

