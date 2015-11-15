import datetime
import cStringIO as StringIO
import requests
import lxml.html


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


def scrape_profile(profile_id):
    profile_xml = parse_page(PROFILE_URL, id=profile_id)
    name = profile_xml.xpath('/html/body/div/h1/span')[0].text_content()
    group = profile_xml.xpath('/html/body/div/table/tr[3]/td[4]')[0]
    group = group.text_content()
    join_date = profile_xml.xpath('/html/body/div/table/tr[4]/td[2]')[0]
    join_date = join_date.text_content()
    join_date = datetime.datetime.strptime(join_date, '%Y-%m-%d %H:%M:%S')

    if not group:
        group = 'none'
    return name, group, join_date
