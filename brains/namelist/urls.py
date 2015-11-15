from django.conf.urls.defaults import patterns, url

urlpatterns = patterns(
    'namelist.views',
    url(r'colors/$', 'process_ids'),
)
