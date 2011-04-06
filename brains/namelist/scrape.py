import requests
import lxml.html
import cookielib
from functools import wraps
import cStringIO as StringIO
from django.conf import settings
from namelist.models import Player


USERNAME = settings.BRAINS_SCRAPE_SETTINGS['username']
PASSWORD = settings.BRAINS_SCRAPE_SETTINGS['password']
PROFILES_URL = 'http://profiles.urbandead.net/index.php'
LOGIN_URL = 'http://urbandead.com/map.cgi'
PROFILE_URL = 'http://urbandead.com/profile.cgi'
COOKIES = cookielib.CookieJar()

class NotFound(Exception):
    pass

def check_login(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            if COOKIES._cookies['urbandead.com']['/']['player'].is_expired():
                login()
        except KeyError:
            login()
        return func(*args, **kwargs)
    return wrapper
        

def login():
    requests.post(LOGIN_URL, data={'username': USERNAME, 'password': PASSWORD}, cookies=COOKIES)


def get_user_profile_id(name):
    io = StringIO.StringIO()
    io.write(requests.get(PROFILES_URL, params={'name': name}).content)
    io.seek(0)
    xml = lxml.html.parse(io)
    try:
        return int(xml.xpath('//table/tbody/tr/td[1]/a')[0].attrib['href'][40:])
    except (IndexError, ValueError) as e:
        raise NotFound(name)
    finally:
        io.close()


@check_login
def scrape_profile(profile_id):
    io = StringIO.StringIO()
    io.write(requests.get(PROFILE_URL, params={'id': profile_id}, cookies=COOKIES).content)
    io.seek(0)
    profile_xml = lxml.html.parse(io)
    name = profile_xml.xpath('/html/body/div/h1/span')[0].text_content()
    group = profile_xml.xpath('/html/body/div/table/tr[3]/td[4]')[0].text_content()
    if group == 'none' or not group:
        group = ''
    return name, group
