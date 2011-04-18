from django.http import HttpResponse

class AccessControl(object):
    
    def process_response(self, request, response):
        if request.method == 'OPTIONS':
            response = HttpResponse(status=200)

        if not request.path.startswith('/admin/') and request.META.has_key('HTTP_ORIGIN'):
            origin = request.META['HTTP_ORIGIN']
            if origin in ('http://urbandead.com', 'http://www.urbandead.com', 'http://localhost:8002'):
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'

        return response

