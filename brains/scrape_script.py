import settings
import requests
import lxml.html
import cookielib
import cStringIO as StringIO

from namelist.models import Category, Player

buffer = StringIO.StringIO()

CATEGORY_NAME = u''
USERNAME = u''
PASSWORD = u''

goon_category = Category.objects.get(name=u'Goon')



GOONS = """""".strip().split('\n')

cookies = cookielib.CookieJar()
requests.post('http://urbandead.com/map.cgi', data={'username': USERNAME, 'password': PASSWORD}, cookies=cookies)

profiles_url = 'http://profiles.urbandead.net/index.php'

for goon in GOONS:
    buffer.seek(0)
    buffer.truncate(0)
    xml = requests.get(profiles_url, params={'name': goon})
    buffer.write(xml.content)
    buffer.seek(0)
    xml = lxml.html.parse(buffer)
    try:
        profile_url = xml.xpath('//table/tbody/tr/td[1]/a')[0].attrib['href']
    except IndexError:
        buffer.seek(0)
        print buffer.read()
        print goon
        exit()

    user_id = int(profile_url[40:])
    profile_xml = requests.get(profile_url, cookies=cookies)
    buffer.seek(0)
    buffer.truncate(0)
    buffer.write(profile_xml.content)
    buffer.seek(0)
    profile_xml = lxml.html.parse(buffer)
    name = profile_xml.xpath('/html/body/div/h1/span')[0].text_content()
    group = profile_xml.xpath('/html/body/div/table/tr[3]/td[4]')[0].text_content()
    if group == 'none' or not group:
        group = ''
    Player.objects.get_or_create(category=goon_category, profile_id=user_id, group_name=group, name=name)
    print 'Created %s' % name

