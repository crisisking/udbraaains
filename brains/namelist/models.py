from django.db import models

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
    group_name = models.CharField(max_length=50, blank=True)
    category = models.ForeignKey(Category, null=True)

    def __unicode__(self):
        return self.name

