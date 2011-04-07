from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('orders.views',
    url(r'^(?P<x>\d+)/(?P<y>\d+)/$', 'index'),
)
