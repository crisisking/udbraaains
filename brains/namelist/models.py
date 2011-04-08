import datetime
from django.db import models
from mapping.models import Location

class Category(models.Model):
    
    class Meta:
        verbose_name_plural = 'categories'
    
    name = models.CharField(max_length=25, null=False, blank=False)
    color_code = models.CharField(max_length=7, null=False, blank=False)
    
    def __unicode__(self):
        return self.name


class Player(models.Model):
    
    name = models.CharField(max_length=20, null=False)
    profile_id = models.IntegerField(null=False, unique=True)
    group_name = models.CharField(max_length=50, blank=False)
    category = models.ForeignKey(Category, null=True, blank=True)
    join_date = models.DateTimeField(default=datetime.datetime.now)
    scrape_date = models.DateTimeField(auto_now=True, auto_now_add=True)
    location = models.ForeignKey(Location, null=True)
    is_dead = models.BooleanField(default=False)


    def __unicode__(self):
        return self.name

