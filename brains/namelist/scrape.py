import datetime
import cStringIO as StringIO
from django.conf import settings
import requests
import lxml.html
from namelist.models import Player


PROFILES_URL = 'http://profiles.urbandead.net/index.php'
PROFILE_URL = 'http://urbandead.com/profile.cgi'

class NotFound(Exception):
    pass


def parse_page(url, **kwargs):
    io = StringIO.StringIO()
    content = requests.get(url, params=kwargs).content
    io.write(content.encode('utf8'))
    io.seek(0)
    xml = lxml.html.parse(io)
    return xml


def get_user_profile_id(name):
    xml = parse_page(PROFILES_URL, name=name)
    try:
        return int(xml.xpath('//table/tbody/tr/td[1]/a')[0].attrib['href'][40:])
    except (IndexError, ValueError) as e:
        raise NotFound(name)
    finally:
        io.close()


def scrape_profile(profile_id):
    profile_xml = parse_page(PROFILE_URL, id=profile_id)
    name = profile_xml.xpath('/html/body/div/h1/span')[0].text_content()
    group = profile_xml.xpath('/html/body/div/table/tr[3]/td[4]')[0].text_content()
    join_date = profile_xml.xpath('/html/body/div/table/tr[4]/td[2]')[0].text_content()
    
    if not group:
        group = 'none'
    return name, group, datetime.datetime.strptime(join_date, '%Y-%m-%d %H:%M:%S')

