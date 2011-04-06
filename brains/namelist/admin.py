from django.contrib import admin
from namelist.models import Category, Player


class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    list_filter = ['category', 'group_name']
    search_fields = ['category__name', 'name', 'group_name']

admin.site.register(Category)
admin.site.register(Player, PlayerAdmin)
