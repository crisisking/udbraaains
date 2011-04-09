# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Report'
        db.create_table('mapping_report', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('is_ruined', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_illuminated', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('has_tree', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
            ('report_date', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, null=True, blank=True)),
            ('barricade_level', self.gf('django.db.models.fields.PositiveSmallIntegerField')(default=0)),
            ('zombies_present', self.gf('django.db.models.fields.PositiveIntegerField')(default=0)),
            ('reported_by', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['namelist.Player'])),
            ('reported_date', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('origin', self.gf('django.db.models.fields.IPAddressField')(max_length=15)),
        ))
        db.send_create_signal('mapping', ['Report'])

        # Deleting field 'Location.zombies_present'
        db.delete_column('mapping_location', 'zombies_present')

        # Deleting field 'Location.report_date'
        db.delete_column('mapping_location', 'report_date')

        # Deleting field 'Location.barricade_level'
        db.delete_column('mapping_location', 'barricade_level')

        # Deleting field 'Location.is_ruined'
        db.delete_column('mapping_location', 'is_ruined')

        # Deleting field 'Location.is_illuminated'
        db.delete_column('mapping_location', 'is_illuminated')

        # Deleting field 'Location.has_tree'
        db.delete_column('mapping_location', 'has_tree')


    def backwards(self, orm):
        
        # Deleting model 'Report'
        db.delete_table('mapping_report')

        # Adding field 'Location.zombies_present'
        db.add_column('mapping_location', 'zombies_present', self.gf('django.db.models.fields.PositiveIntegerField')(default=0), keep_default=False)

        # Adding field 'Location.report_date'
        db.add_column('mapping_location', 'report_date', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, null=True, blank=True), keep_default=False)

        # Adding field 'Location.barricade_level'
        db.add_column('mapping_location', 'barricade_level', self.gf('django.db.models.fields.PositiveSmallIntegerField')(default=0), keep_default=False)

        # Adding field 'Location.is_ruined'
        db.add_column('mapping_location', 'is_ruined', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Location.is_illuminated'
        db.add_column('mapping_location', 'is_illuminated', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        # Adding field 'Location.has_tree'
        db.add_column('mapping_location', 'has_tree', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True), keep_default=False)


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
            'barricade_level': ('django.db.models.fields.PositiveSmallIntegerField', [], {'default': '0'}),
            'has_tree': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_illuminated': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_ruined': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'origin': ('django.db.models.fields.IPAddressField', [], {'max_length': '15'}),
            'report_date': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'null': 'True', 'blank': 'True'}),
            'reported_by': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Player']"}),
            'reported_date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
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
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['namelist.Category']", 'null': 'True', 'blank': 'True'}),
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

    complete_apps = ['mapping']
