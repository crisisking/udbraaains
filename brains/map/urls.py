from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('map.views',
    url(r'collect/$', 'receive_data'),
)
