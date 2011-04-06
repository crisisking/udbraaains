# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Changing field 'Player.category'
        db.alter_column('namelist_player', 'category_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['namelist.Category'], null=True))

        # Adding unique constraint on 'Player', fields ['profile_id']
        db.create_unique('namelist_player', ['profile_id'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'Player', fields ['profile_id']
        db.delete_unique('namelist_player', ['profile_id'])

        # User chose to not deal with backwards NULL issues for 'Player.category'
        raise RuntimeError("Cannot reverse this migration. 'Player.category' and its values cannot be restored.")


    models = {
        'namelist.category': {
            'Meta': {'object_name': 'Category'},
            'color_code': ('django.db.models.fields.CharField', [], {'max_length': '7'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'namelist.player': {
            'Meta': {'object_name': 'Player'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Category']", 'null': 'True'}),
            'group_name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True'})
        }
    }

    complete_apps = ['namelist']
