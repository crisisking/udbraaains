# encoding: utf-8
import datetime
from south.db import db
from south.v2 import DataMigration
from django.db import models

class Migration(DataMigration):

    def forwards(self, orm):
        groups = orm['namelist.player'].objects.filter(group_name__in=["", " ", "none", None])
        groups.update(group_name=None)


    def backwards(self, orm):
        raise RuntimeError("Cannot reverse this migration.")


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
            'group_name': ('django.db.models.fields.CharField', [], {'default': 'None', 'max_length': '50', 'null': 'True', 'db_index': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_dead': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'join_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'location': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['mapping.Location']", 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True', 'db_index': 'True'}),
            'scrape_date': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['namelist']
