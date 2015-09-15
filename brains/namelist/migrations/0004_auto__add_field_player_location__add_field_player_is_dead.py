# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    depends_on = (
        ('mapping', '0001_initial'),
    )

    def forwards(self, orm):
        
        # Adding field 'Player.location'
        db.add_column('namelist_player', 'location', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['mapping.Location'], null=True), keep_default=False)

        # Adding field 'Player.is_dead'
        db.add_column('namelist_player', 'is_dead', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Player.location'
        db.delete_column('namelist_player', 'location_id')

        # Deleting field 'Player.is_dead'
        db.delete_column('namelist_player', 'is_dead')


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
        },
        'namelist.category': {
            'Meta': {'object_name': 'Category'},
            'color_code': ('django.db.models.fields.CharField', [], {'max_length': '7'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'namelist.player': {
            'Meta': {'object_name': 'Player'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Category']", 'null': 'True'}),
            'group_name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_dead': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'join_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'location': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['mapping.Location']", 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True'}),
            'scrape_date': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['namelist']
