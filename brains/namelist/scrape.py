import datetime
import cStringIO as StringIO
from django.conf import settings
import requests
import lxml.html
from namelist.models import Player


USERNAME = settings.BRAINS_SCRAPE_SETTINGS['username']
PASSWORD = settings.BRAINS_SCRAPE_SETTINGS['password']
PROFILES_URL = 'http://profiles.urbandead.net/index.php'
PROFILE_URL = 'http://urbandead.com/profile.cgi'

class NotFound(Exception):
    pass


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


def scrape_profile(profile_id):
    io = StringIO.StringIO()
    io.write(requests.get(PROFILE_URL, params={'id': profile_id}).content)
    io.seek(0)
    profile_xml = lxml.html.parse(io)
    name = profile_xml.xpath('/html/body/div/h1/span')[0].text_content()
    group = profile_xml.xpath('/html/body/div/table/tr[3]/td[4]')[0].text_content()
    join_date = profile_xml.xpath('/html/body/div/table/tr[4]/td[2]')[0].text_content()
    
    if not group:
        group = 'none'
    return name, group, datetime.datetime.strptime(join_date, '%Y-%m-%d %H:%M:%S')

