from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('mapping.views',
    url(r'collect/$', 'receive_data'),
    url(r'data/$', 'map_data'),
)
