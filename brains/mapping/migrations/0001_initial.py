# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Location'
        db.create_table('mapping_location', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('x', self.gf('django.db.models.fields.PositiveSmallIntegerField')()),
            ('y', self.gf('django.db.models.fields.PositiveSmallIntegerField')()),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('building_type', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('barricade_level', self.gf('django.db.models.fields.PositiveSmallIntegerField')(default=0)),
            ('zombies_present', self.gf('django.db.models.fields.PositiveIntegerField')(default=0)),
            ('is_ruined', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_illuminated', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('has_tree', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('report_date', self.gf('django.db.models.fields.DateTimeField')(default=None, auto_now=True, blank=True)),
        ))
        db.send_create_signal('mapping', ['Location'])


    def backwards(self, orm):
        
        # Deleting model 'Location'
        db.delete_table('mapping_location')


    models = {
        'mapping.location': {
            'Meta': {'object_name': 'Location'},
            'barricade_level': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '0'}),
            'building_type': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'has_tree': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_illuminated': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_ruined': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'report_date': ('django.db.models.fields.DateTimeField', [], {'default': 'None', 'auto_now': 'True', 'blank': 'True'}),
            'x': ('django.db.models.fields.PositiveSmallIntegerField', [], {}),
            'y': ('django.db.models.fields.PositiveSmallIntegerField', [], {}),
            'zombies_present': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'})
        }
    }

    complete_apps = ['mapping']
