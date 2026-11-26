"""Precompute conservative same-floor line-of-sight links with Shapely.

Requires Shapely 2.1.2 at build time only. The browser bundle contains JSON,
not Shapely. A 3 SVG-unit clearance is applied around floors and obstacles.
Run from ui/: python scripts/build-local-links.py
"""

import json
import math
from pathlib import Path

from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
SPATIAL = json.loads((ROOT / 'src/data/navigation/spatial.generated.json').read_text(encoding='utf-8'))
GRAPH = json.loads((ROOT / 'src/data/navigation/graph.generated.json').read_text(encoding='utf-8'))
OUTPUT = ROOT / 'src/data/navigation/local-links.generated.json'
BLOCKED = {'WALL', 'OBSTACLE', 'FACILITY', 'VERTICAL_CONNECTOR',
           'RESTRICTED_AREA', 'UNKNOWN_AREA'}
CLEARANCE_UNITS = 3


def polygon(area):
    result = Polygon(area['polygon'])
    if not result.is_valid or result.area <= 0:
        raise ValueError(f'Invalid spatial polygon: {area["id"]}')
    return result


def main():
    links = []
    counts = {}
    for floor_id, floor in GRAPH['floors'].items():
        areas = SPATIAL['floors'][floor_id]['areas']
        envelope = unary_union([polygon(area) for area in areas
                                if area['type'] in ('WALKABLE_AREA', 'OPEN_AREA', 'CORRIDOR')])
        obstacles = [polygon(area) for area in areas if area['type'] in BLOCKED]
        safe = envelope.buffer(-CLEARANCE_UNITS)
        if obstacles:
            safe = safe.difference(unary_union(obstacles).buffer(CLEARANCE_UNITS))
        nodes = floor['nodes']
        before = len(links)
        for index, source in enumerate(nodes):
            a = (source['x'], source['y'])
            if not safe.covers(Point(a)):
                continue
            for target in nodes[index + 1:]:
                b = (target['x'], target['y'])
                if math.dist(a, b) < 1:
                    continue
                line = LineString([a, b])
                if not safe.covers(line):
                    continue
                links.append({
                    'floor': floor_id, 'source': source['id'], 'target': target['id'],
                    'points': [list(a), list(b)],
                    'distanceM': round(line.length * SPATIAL['floors'][floor_id]['metersPerUnit'], 4),
                    'verificationStatus': 'ESTIMATED',
                })
        counts[floor_id] = len(links) - before
    OUTPUT.write_text(json.dumps({'schemaVersion': 1,
                                  'graphSourceSha256': GRAPH['sourceSha256'],
                                  'clearanceSvgUnits': CLEARANCE_UNITS,
                                  'links': links}, ensure_ascii=False,
                                 separators=(',', ':')) + '\n', encoding='utf-8')
    print(counts)


if __name__ == '__main__':
    main()
