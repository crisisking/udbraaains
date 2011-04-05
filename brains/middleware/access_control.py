from django.http import HttpResponse

class AccessControl(object):
    
    def process_response(self, request, response):
        if not request.path.startswith('/admin/') and request.META.has_key('HTTP_ORIGIN'):
            origin = request.META['HTTP_ORIGIN']
            if origin in ('http://urbandead.com', 'http://www.urbandead.com'):
                response['Access-Control-Allow-Origin'] = origin
        return response

