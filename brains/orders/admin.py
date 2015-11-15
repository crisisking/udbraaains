from orders.models import Order
from django.contrib import admin


class OrderAdmin(admin.ModelAdmin):
    readonly_fields = ('user', 'date')

    def save_model(self, request, obj, form, change):
        obj.user = request.user
        obj.save()

admin.site.register(Order, OrderAdmin)
