"""Extract the 3F floor polygon and room rectangles from the current plan SVG.

Run in ui/: python scripts/build-walkable-plan.py
The result is a plan-derived mask, not a field-verified accessibility survey.
"""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parents[1]
svg_path = root / 'public/maps/web-3F-map.svg'
output = root / 'src/data/station/3f-walkable-plan.generated.json'
svg = ET.parse(svg_path).getroot()
floor = next(element for element in svg.iter()
             if element.attrib.get('id', '').startswith('3F-BLD'))
polygon = [[float(x), float(y)] for x, y in
           re.findall(r'[ML]([\d.]+) ([\d.]+)', floor.attrib['d'])]
rooms = [
    [float(element.attrib[key]) for key in ('x', 'y', 'width', 'height')]
    for element in svg.iter()
    if element.attrib.get('class', '').startswith('room-')
]
output.write_text(json.dumps({'source': 'web-3F-map.svg', 'polygon': polygon,
                              'rooms': rooms}, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'{len(polygon)} floor vertices, {len(rooms)} rooms -> {output.name}')
