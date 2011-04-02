from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Order(models.Model):
    user = models.ForeignKey(User)
    date = models.DateTimeField(auto_now_add=True)
    message = models.TextField()
    subject = models.CharField(max_length=250)

    def __unicode__(self):
        return self.subject
