"""Extract conservative spatial polygons from the design team's floor-plan SVGs.

The building floor polygon is an estimated traversable envelope, not a field survey.
Rooms and restricted zones are excluded from free-space routing. Text and icons are
deliberately ignored. Run from ui/: python scripts/build-spatial-data.py
"""

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / 'src/data/navigation/spatial.generated.json'
SOURCE = json.loads((ROOT / 'src/data/daejeon_routes_calculated.json').read_text(encoding='utf-8'))
ROOM_TYPES = {
    'room-shop': 'FACILITY',
    'room-facility': 'FACILITY',
    'room-toilet': 'FACILITY',
    'room-vertical': 'VERTICAL_CONNECTOR',
    'room-escalator': 'VERTICAL_CONNECTOR',
    'room-platform': 'RESTRICTED_AREA',
}


def path_polygon(value):
    if set(re.findall(r'[A-Za-z]', value)) - {'M', 'L', 'Z'}:
        raise ValueError('Unsupported SVG path command')
    numbers = [float(item) for item in re.findall(r'-?\d+(?:\.\d+)?', value)]
    if len(numbers) < 6 or len(numbers) % 2:
        raise ValueError('Invalid polygon path')
    return [[numbers[index], numbers[index + 1]] for index in range(0, len(numbers), 2)]


def rectangle(element):
    x, y, width, height = [float(element.get(key)) for key in ('x', 'y', 'width', 'height')]
    if width <= 0 or height <= 0:
        raise ValueError(f'Invalid rectangle: {element.get("id")}')
    return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]]


def main():
    floors = {}
    for floor_id in ('1F', '2F', '3F', '4F'):
        source_name = f'web-{floor_id}-map.svg'
        root = ET.parse(ROOT / 'public/maps' / source_name).getroot()
        areas = []
        for element in root.iter():
            css_class = element.get('class')
            tag = element.tag.rsplit('}', 1)[-1]
            if css_class == 'map-floor' and tag == 'path':
                area_type = 'WALKABLE_AREA'
                polygon = path_polygon(element.get('d'))
            elif css_class in ROOM_TYPES and tag in ('rect', 'path'):
                area_type = ROOM_TYPES[css_class]
                polygon = rectangle(element) if tag == 'rect' else path_polygon(element.get('d'))
            elif css_class in ('zone-parking', 'zone-roof', 'zone-outdoor') and tag == 'path':
                area_type = 'UNKNOWN_AREA'
                polygon = path_polygon(element.get('d'))
            else:
                continue
            areas.append({
                'id': element.get('id'), 'floor': floor_id, 'type': area_type,
                'polygon': polygon, 'verificationStatus': 'ESTIMATED',
                'source': source_name,
            })
        floors[floor_id] = {
            'floor': floor_id, 'coordinateSystem': 'SVG_VIEWBOX',
            'metersPerUnit': SOURCE['method']['mapScale']['metersPerSvgUnit'],
            'scaleVerificationStatus': 'ESTIMATED',
            'viewBox': [float(value) for value in root.get('viewBox').split()],
            'areas': areas,
        }
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    DESTINATION.write_text(json.dumps({'schemaVersion': 1, 'floors': floors}, ensure_ascii=False,
                                      separators=(',', ':')) + '\n', encoding='utf-8')
    print({floor: len(data['areas']) for floor, data in floors.items()})


if __name__ == '__main__':
    main()
