from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('orders.views',
    url(r'^$', 'index'),
)
