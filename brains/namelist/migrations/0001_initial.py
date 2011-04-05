# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Category'
        db.create_table('namelist_category', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('color_code', self.gf('django.db.models.fields.CharField')(max_length=7)),
        ))
        db.send_create_signal('namelist', ['Category'])

        # Adding model 'Player'
        db.create_table('namelist_player', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('profile_id', self.gf('django.db.models.fields.IntegerField')()),
            ('group_name', self.gf('django.db.models.fields.CharField')(max_length=50, blank=True)),
            ('category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['namelist.Category'])),
        ))
        db.send_create_signal('namelist', ['Player'])


    def backwards(self, orm):
        
        # Deleting model 'Category'
        db.delete_table('namelist_category')

        # Deleting model 'Player'
        db.delete_table('namelist_player')


    models = {
        'namelist.category': {
            'Meta': {'object_name': 'Category'},
            'color_code': ('django.db.models.fields.CharField', [], {'max_length': '7'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'namelist.player': {
            'Meta': {'object_name': 'Player'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Category']"}),
            'group_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {})
        }
    }

    complete_apps = ['namelist']
