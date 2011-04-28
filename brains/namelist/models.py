import datetime
from django.db import models
from mapping.models import Report

class Category(models.Model):
    
    class Meta:
        verbose_name_plural = 'categories'
    
    name = models.CharField(max_length=25, null=False, blank=False)
    color_code = models.CharField(max_length=7, null=False, blank=False)
    
    def __unicode__(self):
        return self.name


class Player(models.Model):
    
    name = models.CharField(max_length=50, null=False, db_index=True)
    profile_id = models.IntegerField(null=False, unique=True, db_index=True)
    group_name = models.CharField(max_length=50, blank=True, null=True, default=None, db_index=True)
    category = models.ForeignKey(Category, null=True, blank=True)
    join_date = models.DateTimeField(default=datetime.datetime.now)
    scrape_date = models.DateTimeField(auto_now=True, auto_now_add=True)
    is_dead = models.BooleanField(default=False, db_index=True)


    def last_known_position(self):
        """Grabs the player's last known location from the report set."""
        try:
            last_filed = self.report_set.filter(zombies_only=False).order_by('-reported_date')[0]
        except IndexError:
            last_filed = None
        try:
            last_spotted = self.reported_at.order_by('-reported_date')[0]
        except IndexError:
            last_spotted = None
        if last_filed is None and last_spotted is None:
            return u"Never seen"
        else:
            if last_filed is None:
                return last_spotted.location
            elif last_spotted is None:
                return last_filed.location
            else:
                if last_filed >= last_spotted:
                    return last_filed.location
                else:
                    return last_spotted.location


    def __unicode__(self):
        return self.name

