from django.contrib import admin
from namelist.models import Player, Category


class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'group_name', 'last_known_position']
    list_select_related = False
    list_filter = ['category']
    search_fields = ['^name', '^group_name']
    readonly_fields = ['scrape_date', 'last_known_position']


admin.site.register(Category)
admin.site.register(Player, PlayerAdmin)
