from django.http import HttpResponse
from django.shortcuts import redirect, render_to_response
from django.contrib import admin
from django.conf.urls.defaults import patterns, include, url
from django import forms
from django.template import RequestContext
from namelist.models import Player, Category
from namelist.scrape import get_user_profile_id, scrape_profile
from namelist.tasks import import_user


class PlayerAddForm(forms.Form):
    names = forms.CharField(widget=forms.Textarea(), required=True)
    category = forms.ModelChoiceField(queryset=Category.objects.all(), required=False)
    
    def clean_names(self):
        names = [name.strip() for name in self.cleaned_data['names'].split('\n') if name.strip()]
        if not len(names):
            raise forms.ValidationError("You didn't submit any names!")
        return names


class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'location']
    list_filter = ['category', 'group_name']
    search_fields = ['category__name', 'name', 'group_name']
    readonly_fields = ['scrape_date', 'location']
    
    def get_urls(self):
        urls = super(PlayerAdmin, self).get_urls()
        admin_urls = patterns('', 
            url(r'^add_bulk/$', self.admin_site.admin_view(self.add_bulk)),
        )
        
        return admin_urls + urls

    def add_bulk(self, request):
        if request.method == 'POST':
            form = PlayerAddForm(request.POST)
            if form.is_valid():
                print form.cleaned_data['names']
                for name in form.cleaned_data['names']:
                    import_user.delay(name, category=form.cleaned_data['category'], user=request.user)
                self.message_user(request, 'Importing users...')
                return redirect('admin:namelist_player_changelist')
                
        form = PlayerAddForm()
        context = RequestContext(request, current_app=self.admin_site.name)
        return render_to_response('admin/namelist/player/add_bulk.html', {
            'app_label': self.model._meta.app_label,
            'opts': self.model._meta,
            'has_change_permission': request.user.has_perm('namelist.change_player'),
            'add': True,
            'title': 'Add Players',
            'form': form,
            'media': self.media,
        }, context_instance=context)        


admin.site.register(Category)
admin.site.register(Player, PlayerAdmin)
