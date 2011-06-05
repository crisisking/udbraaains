# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Reporter'
        db.create_table('mapping_reporter', (
            ('address', self.gf('django.db.models.fields.IPAddressField')(max_length=15, primary_key=True)),
            ('blacklisted', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
        ))
        db.send_create_signal('mapping', ['Reporter'])

        # Adding M2M table for field known_players on 'Reporter'
        db.create_table('mapping_reporter_known_players', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('reporter', models.ForeignKey(orm['mapping.reporter'], null=False)),
            ('player', models.ForeignKey(orm['namelist.player'], null=False))
        ))
        db.create_unique('mapping_reporter_known_players', ['reporter_id', 'player_id'])

        # Adding field 'Report.reporter'
        db.add_column('mapping_report', 'reporter', self.gf('django.db.models.fields.related.ForeignKey')(related_name='reported_at', null=True, to=orm['mapping.Reporter']), keep_default=False)


    def backwards(self, orm):
        
        # Deleting model 'Reporter'
        db.delete_table('mapping_reporter')

        # Removing M2M table for field known_players on 'Reporter'
        db.delete_table('mapping_reporter_known_players')

        # Deleting field 'Report.reporter'
        db.delete_column('mapping_report', 'reporter_id')


    models = {
        'mapping.location': {
            'Meta': {'unique_together': "(('x', 'y'),)", 'object_name': 'Location'},
            'building_type': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'suburb': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'x': ('django.db.models.fields.PositiveSmallIntegerField', [], {}),
            'y': ('django.db.models.fields.PositiveSmallIntegerField', [], {})
        },
        'mapping.report': {
            'Meta': {'object_name': 'Report'},
            'barricade_level': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '0', 'null': 'True'}),
            'has_tree': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inside': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'is_illuminated': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_ruined': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'location': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['mapping.Location']"}),
            'origin': ('django.db.models.fields.IPAddressField', [], {'max_length': '15'}),
            'players': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'reported_at'", 'symmetrical': 'False', 'to': "orm['namelist.Player']"}),
            'reported_by': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Player']"}),
            'reported_date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'db_index': 'True', 'blank': 'True'}),
            'reporter': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'reported_at'", 'null': 'True', 'to': "orm['mapping.Reporter']"}),
            'zombies_only': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'db_index': 'True'}),
            'zombies_present': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'})
        },
        'mapping.reporter': {
            'Meta': {'object_name': 'Reporter'},
            'address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15', 'primary_key': 'True'}),
            'blacklisted': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'known_players': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'reported_from'", 'symmetrical': 'False', 'to': "orm['namelist.Player']"})
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
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'profile_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True', 'db_index': 'True'}),
            'scrape_date': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['mapping']
