from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Order(models.Model):
    user = models.ForeignKey(User)
    # Last updated timestamp, used for sorting
    date = models.DateTimeField(auto_now_add=True, auto_now=True)
    # When we will strike
    striketime = models.DateTimeField(null=True, blank=True)
    message = models.TextField()
    subject = models.CharField(max_length=250)
    # Coordinates of where this news applies
    # By default, set it to the middle of the map
    x = models.IntegerField(default=50)
    y = models.IntegerField(default=50)

    def __unicode__(self):
        return self.subject
