"""Builds map_data required by the server to function correctly."""

import re
import os
import lxml.html

COORD = re.compile(r'\[(\d+), (\d+)\]')
LINE = '{building_type} {x} {y} {building_name}\n'

def main():
    with open('map_data', 'w') as map_data:
        for suburb_file in [path for path in os.listdir('suburbs') if not path.startswith('.'):
            suburb = lxml.html.parse(os.path.join('suburbs', suburb_file))
            for cell in suburb.xpath('/html/body/table/tr/td/table//td'):
                lines = cell.text_content().strip().split('\n\n')
                coords = COORD.search(lines[1])
                line = LINE.format(building_type=cell.attrib['class'][:-1], 
                    x=coords.group(1), 
                    y=coords.group(2), 
                building_name=lines[0])
                map_data.write(line)


if __name__ == '__main__':
    main()