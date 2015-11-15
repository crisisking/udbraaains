from django.conf.urls.defaults import patterns, url

urlpatterns = patterns(
    'orders.views',
    url(r'^(?P<x>\d+)/(?P<y>\d+)/$', 'index'),
)
