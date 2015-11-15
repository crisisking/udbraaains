from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^orders/', include('orders.urls')),
    url(r'^names/', include('namelist.urls')),
    url(r'^map/', include('mapping.urls')),
)
