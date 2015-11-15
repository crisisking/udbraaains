from django.contrib import admin
from mapping.models import Location, Report


class LocationAdmin(admin.ModelAdmin):

    fieldsets = (
        (None, {'fields': (
            ('name', 'suburb'),
            ('x', 'y'),
            'building_type'
        )}),
    )
    list_display = ['name', 'x', 'y', 'suburb']
    list_filter = ['suburb']
    search_fields = ['name']
    readonly_fields = ['x', 'y', 'name', 'building_type', 'suburb']
    actions = None

    def has_add_permission(self, request):
        return False


class ReportAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {'fields': (
            'location',
            ('zombies_only', 'inside'),
            ('is_ruined', 'is_illuminated', 'has_tree'),
            ('zombies_present', 'barricade_level'),
            'players',
            ('reported_by', 'origin'),
            'reported_date',
        )}),
    )

    readonly_fields = ['location', 'zombies_only', 'inside', 'is_ruined',
                       'is_illuminated', 'has_tree', 'zombies_present',
                       'barricade_level', 'players', 'reported_by', 'origin',
                       'reported_date']


admin.site.register(Location, LocationAdmin)
admin.site.register(Report, ReportAdmin)
