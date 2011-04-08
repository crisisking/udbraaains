from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('mapping.views',
    url(r'collect/$', 'receive_data'),
)
