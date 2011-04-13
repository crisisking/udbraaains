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
        reports = Report.objects.raw("""SELECT "mapping_report"."id",
        "mapping_report"."location_id", "mapping_location"."id", 
        "mapping_location"."x", "mapping_location"."y",
        "mapping_location"."name", "mapping_location"."suburb"
        FROM "mapping_report" 
        INNER JOIN "namelist_player" 
        ON ("mapping_report"."reported_by_id" = "namelist_player"."id") 
        LEFT OUTER JOIN "mapping_report_players" 
        ON ("mapping_report"."id" = "mapping_report_players"."report_id") 
        INNER JOIN "mapping_location" ON ("mapping_report"."location_id" = "mapping_location"."id") 
        WHERE ("mapping_report"."reported_by_id" = %s  OR "mapping_report_players"."player_id" = %s ) 
        ORDER BY "mapping_report"."reported_date" DESC
        LIMIT 1""", [self.id, self.id])
        try:
            return reports[0].location
        except IndexError:
            return u"Never seen"


    def __unicode__(self):
        return self.name

