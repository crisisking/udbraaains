# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding index on 'Player', fields ['is_dead']
        db.create_index('namelist_player', ['is_dead'])

        # Adding index on 'Player', fields ['profile_id']
        db.create_index('namelist_player', ['profile_id'])


    def backwards(self, orm):
        
        # Removing index on 'Player', fields ['profile_id']
        db.delete_index('namelist_player', ['profile_id'])

        # Removing index on 'Player', fields ['is_dead']
        db.delete_index('namelist_player', ['is_dead'])


    models = {
        'mapping.location': {
            'Meta': {'unique_together': "(('x', 'y'),)", 'object_name': 'Location'},
            'building_type': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'has_tree': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'suburb': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'x': ('django.db.models.fields.PositiveSmallIntegerField', [], {}),
            'y': ('django.db.models.fields.PositiveSmallIntegerField', [], {})
        },
        'namelist.category': {
            'Meta': {'object_name': 'Category'},
            'color_code': ('django.db.models.fields.CharField', [], {'max_length': '7'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'namelist.player': {
            'Meta': {'object_name': 'Player'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Category']", 'null': 'True', 'blank': 'True'}),
            'group_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_dead': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'join_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'location': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['mapping.Location']", 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True', 'db_index': 'True'}),
            'scrape_date': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['namelist']
