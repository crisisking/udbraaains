from django.shortcuts import render_to_response
from django.template import RequestContext
from orders.models import Order

def index(request):
    return render_to_response('orders/orders.html', 
        { 'orders': Order.objects.all().order_by('-date')[0:2] },
        context_instance=RequestContext(request)
    )
