from django.db import models

class Location(models.Model):
    
    # Location types taken from http://dssrzs.org/map/city
    LOCATION_TYPES = (
        ('famy', 'Armory'), 
        ('fbar', 'Barracks'), 
        ('fexy', 'Exercise Yard'), 
        ('motl', 'Motel'), 
        ('wast', 'Wasteland'), 
        ('fvdp', 'Vehicle Depot'), 
        ('finf', 'Infirmary'), 
        ('cath', 'Cathedral'), 
        ('ftgr', 'Training Ground'), 
        ('cine', 'Cinema'), 
        ('arms', 'Arms'), 
        ('club', 'Club'), 
        ('psta', 'Power Station'), 
        ('rsta', 'Railway Station'), 
        ('hotl', 'Hotel'), 
        ('opns', 'Street'), 
        ('junk', 'Junkyard'), 
        ('cprk', 'Car Park'), 
        ('musm', 'Museum'), 
        ('fire', 'Fire Station'), 
        ('auto', 'Auto Repair'), 
        ('park', 'Park'), 
        ('bldg', 'Building'), 
        ('fsto', 'Storehouse'), 
        ('stad', 'Stadium'), 
        ('chur', 'Church'), 
        ('hosp', 'Hospital'), 
        ('libr', 'Library'), 
        ('ware', 'Warehouse'), 
        ('bank', 'Bank'), 
        ('pdep', 'Police Department'), 
        ('zooe', 'Enclosure'), 
        ('fgat', 'Gatehouse'), 
        ('ntbg', 'NecroTech Building'), 
        ('mall', 'Mall'), 
        ('mnsn', 'Mansion'), 
        ('monu', 'Monument'), 
        ('zoox', 'Zoo'), 
        ('scho', 'School'), 
        ('ceme', 'Cemetary'), 
        ('towr', 'Tower'), 
        ('fact', 'Factory'),
    )
    
    class Meta:
        unique_together = ('x', 'y')
    
    x = models.PositiveSmallIntegerField()
    y = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=300)
    building_type = models.CharField(max_length=4, choices=LOCATION_TYPES)
    barricade_level = models.PositiveSmallIntegerField(default=0)
    zombies_present = models.PositiveIntegerField(default=0)
    is_ruined = models.BooleanField(default=False)
    is_illuminated = models.BooleanField(default=True)
    has_tree = models.BooleanField(default=False)
    report_date = models.DateTimeField(auto_now=True, default=None)
