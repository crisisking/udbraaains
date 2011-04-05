from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('namelist.views',
    url(r'colors/$', 'process_ids'),
)
