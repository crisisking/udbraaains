# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Changing field 'Player.name'
        db.alter_column('namelist_player', 'name', self.gf('django.db.models.fields.CharField')(max_length=50))


    def backwards(self, orm):
        
        # Changing field 'Player.name'
        db.alter_column('namelist_player', 'name', self.gf('django.db.models.fields.CharField')(max_length=20))


    models = {
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
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True', 'db_index': 'True'}),
            'scrape_date': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['namelist']
