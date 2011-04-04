from django.db import models

class Category(models.Model):
    
    name = models.CharField(max_length=25, null=False, blank=False)
    color_code = models.CharField(max_length=7, null=False, blank=False)

class Player(models.Model):
    
    name = models.CharField(max_length=20, null=False)
    profile_id = models.IntegerField(null=False)
    group_name = models.CharField(max_length=50, blank=True)
    category = models.ForeignKey(Category, null=False)

