from django.contrib import admin
from mapping.models import Location

class LocationAdmin(admin.ModelAdmin):
    
    fieldsets = ((None,
        {'fields': (
            ('name', 'suburb'), 
            ('x', 'y'), 
            'building_type', 
            ('barricade_level', 'zombies_present'),
            ('is_ruined', 'is_illuminated', 'has_tree')
        )}
    ),)
    list_display = ['name', 'x', 'y', 'suburb']
    list_filter = ['suburb']
    search_fields = ['name']
    readonly_fields = ['x', 'y', 'name', 'building_type', 'suburb']
    actions = None
    
    def has_add_permission(self, request):
        return False

admin.site.register(Location, LocationAdmin)
