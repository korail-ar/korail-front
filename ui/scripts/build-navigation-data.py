"""Migrate the preserved calculated graph without changing its source JSON.

The shared west-corridor point is visible in existing E028/E054 geometry. Its
split does not assert any new physical passage. Run from ui/.
"""

import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/data/daejeon_routes_calculated.json'
PLACES = ROOT / 'src/data/station/station3f.generated.json'
DESTINATION = ROOT / 'src/data/navigation'


def edge(edge_id, source, target, points, scale, speed):
    meters = round(sum(math.dist(a, b) for a, b in zip(points, points[1:])) * scale, 4)
    seconds = round(meters / speed, 3)
    return {
        'id': edge_id, 'source': source, 'target': target,
        'geometrySvg': points, 'routingEnabled': True, 'distanceM': meters,
        'timeSeconds': seconds, 'dijkstraWeightSeconds': seconds,
        'verificationStatus': 'ESTIMATED',
    }


def main():
    raw = SOURCE.read_bytes()
    source = json.loads(raw)
    floor = source['floors']['3F']
    scale = source['method']['mapScale']['metersPerSvgUnit']
    speed = source['method']['walkingSpeedKmh'] * 1000 / 3600
    junction = {'id': 'J3W1145', 'name': '서쪽 통로 교차점', 'kind': 'junction',
                'x': 520, 'y': 1145, 'verificationStatus': 'ESTIMATED'}
    if any(node['id'] == junction['id'] for node in floor['nodes']):
        raise ValueError('Migration must use the preserved source graph')
    floor['nodes'].append(junction)
    old = {item['id']: item for item in floor['edges']}
    for edge_id in ('E028', 'E054'):
        if edge_id not in old:
            raise ValueError(f'Missing source edge {edge_id}')
    floor['edges'] = [item for item in floor['edges'] if item['id'] not in ('E028', 'E054')]
    floor['edges'].extend([
        edge('E028A', 'B05', 'J3W1145', [[520, 1105], [520, 1145]], scale, speed),
        edge('E028B', 'J3W1145', 'B06', [[520, 1145], [520, 1215], [505, 1215]], scale, speed),
        edge('E054B', 'J3W1145', 'P26', [[520, 1145], [610, 1145]], scale, speed),
    ])
    graph = {
        'schemaVersion': 1,
        'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'method': source['method'],
        'floors': source['floors'],
        'verticalLinks': source['verticalLinks'],
        'migration': {
            'addedNodes': ['3F:J3W1145'],
            'removedEdges': ['3F:E028', '3F:E054'],
            'addedEdges': ['3F:E028A', '3F:E028B', '3F:E054B'],
            'reason': 'Split existing overlapping 3F corridor geometries at (520,1145)',
        },
    }
    places = json.loads(PLACES.read_text(encoding='utf-8'))['places']
    facilities = []
    for place in places:
        access_node = place['routeNodeId']
        facilities.append({
            'id': place['id'], 'name': place['name'], 'floor': '3F',
            'displayPosition': [place['x'], place['y']] if place['x'] is not None else None,
            'entrances': [{
                'id': f'3F:{place["id"]}:access', 'position': None,
                'connectedNodeId': access_node, 'accessible': None,
                'verificationStatus': 'ESTIMATED' if access_node else 'UNVERIFIED',
                'kind': 'APPROACH_POINT_NOT_VERIFIED_ENTRANCE',
            }] if access_node else [],
        })
    DESTINATION.mkdir(parents=True, exist_ok=True)
    (DESTINATION / 'graph.generated.json').write_text(
        json.dumps(graph, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    (DESTINATION / 'facilities.generated.json').write_text(
        json.dumps({'schemaVersion': 1, 'facilities': facilities}, ensure_ascii=False,
                   separators=(',', ':')) + '\n', encoding='utf-8')
    print({'nodes': sum(len(item['nodes']) for item in graph['floors'].values()),
           'edges': sum(len(item['edges']) for item in graph['floors'].values()),
           'facilities': len(facilities)})


if __name__ == '__main__':
    main()
