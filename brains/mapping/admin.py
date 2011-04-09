from django.contrib import admin
from mapping.models import Location, Report

class LocationAdmin(admin.ModelAdmin):
    
    fieldsets = ((None,
        {'fields': (
            ('name', 'suburb'), 
            ('x', 'y'), 
            'building_type'
        )}
    ),)
    list_display = ['name', 'x', 'y', 'suburb']
    list_filter = ['suburb']
    search_fields = ['name']
    readonly_fields = ['x', 'y', 'name', 'building_type', 'suburb']
    actions = None
    
    def has_add_permission(self, request):
        return False

class ReportAdmin(admin.ModelAdmin):
    readonly_fields = ['reported_by']


admin.site.register(Location, LocationAdmin)
admin.site.register(Report, ReportAdmin)
