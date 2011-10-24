import re
from django.http import HttpResponse


ALLOWED_PATTERN = re.compile(r'http://(www\.)urbandead\.com')


class AccessControl(object):
    
    def process_response(self, request, response):
        if request.method == 'OPTIONS':
            response = HttpResponse(status=200)

        if not request.path.startswith('/admin/') and 'HTTP_ORIGIN' in request.META:
            origin = request.META['HTTP_ORIGIN']
            if ALLOWED_PATTERN.search(origin):
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'

        return response

