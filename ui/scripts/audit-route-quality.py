"""Audit graph geometry and route regressions against the current floor plans.

Run from ui/: python scripts/audit-route-quality.py
"""

import heapq
import json
import math
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'src/data/daejeon_routes_calculated.json').read_text(encoding='utf-8'))
SCALE = DATA['method']['mapScale']['metersPerSvgUnit']


def length(points):
    return sum(math.dist(a, b) for a, b in zip(points, points[1:]))


def crosses_rect_interior(points, rect):
    x, y, width, height = rect
    low_x, high_x = x + 2, x + width - 2
    low_y, high_y = y + 2, y + height - 2
    if low_x >= high_x or low_y >= high_y:
        return False
    for a, b in zip(points, points[1:]):
        start, end = 0.0, 1.0
        for origin, delta, low, high in (
            (a[0], b[0] - a[0], low_x, high_x),
            (a[1], b[1] - a[1], low_y, high_y),
        ):
            if abs(delta) < 1e-9:
                if not low < origin < high:
                    break
            else:
                t1, t2 = sorted(((low - origin) / delta, (high - origin) / delta))
                start, end = max(start, t1), min(end, t2)
        else:
            if (end - start) * math.dist(a, b) > 2:
                return True
    return False


def plan_rooms(floor_id):
    root = ET.parse(ROOT / f'public/maps/web-{floor_id}-map.svg').getroot()
    rooms = []
    for element in root.iter():
        if element.tag.endswith('rect') and element.get('class') in (
            'room-shop', 'room-facility', 'room-toilet',
        ):
            rooms.append((element.get('id'), tuple(float(element.get(key)) for key in (
                'x', 'y', 'width', 'height',
            ))))
    return rooms


def graph_edges(baseline=False, elevator_only=False):
    graph = {f'{floor_id}:{node["id"]}': [] for floor_id, floor in DATA['floors'].items()
             for node in floor['nodes']}
    for floor_id, floor in DATA['floors'].items():
        edges = [edge for edge in floor['edges'] if edge['routingEnabled']]
        if floor_id == '3F' and baseline:
            edges = [edge for edge in edges if edge['id'] not in ('E079', 'E080', 'E081')]
            edges.append({
                'id': 'E034', 'source': 'H07', 'target': 'C01',
                'geometrySvg': [[855, 1125], [855, 995], [1075, 995]],
                'distanceM': 36.715, 'timeSeconds': 33.044,
            })
            edges.append({
                'id': 'E014', 'source': 'A01', 'target': 'A02',
                'geometrySvg': [[1195, 420], [1185, 420], [1185, 680]],
                'distanceM': 28.3229, 'timeSeconds': 25.491,
            })
        for edge in edges:
            a, b = f'{floor_id}:{edge["source"]}', f'{floor_id}:{edge["target"]}'
            graph[a].append((b, edge['timeSeconds'], edge['distanceM'], edge))
            graph[b].append((a, edge['timeSeconds'], edge['distanceM'], edge))
    for link in DATA['verticalLinks']:
        if not link['routingEnabled'] or (elevator_only and link['kind'] != 'elevator'):
            continue
        a = f'{link["from"]["sourceFloor"]}:{link["from"]["sourceGraphNodeId"]}'
        b = f'{link["to"]["targetFloor"]}:{link["to"]["targetGraphNodeId"]}'
        graph[a].append((b, link['dijkstraWeightSeconds']['sourceToTarget'],
                         link['distanceMIncludingApproach'], link))
        if link['direction'] == 'both':
            graph[b].append((a, link['dijkstraWeightSeconds']['targetToSource'],
                             link['distanceMIncludingApproach'], link))
    return graph


def shortest(graph, source):
    best = {source: (0.0, 0.0)}
    previous = {}
    queue = [(0.0, 0.0, source)]
    while queue:
        seconds, meters, node = heapq.heappop(queue)
        if (seconds, meters) != best[node]:
            continue
        for target, extra_seconds, extra_meters, edge in graph[node]:
            candidate = (round(seconds + extra_seconds, 3), round(meters + extra_meters, 4))
            if candidate < best.get(target, (math.inf, math.inf)):
                best[target] = candidate
                previous[target] = (node, edge)
                heapq.heappush(queue, (*candidate, target))
    return best, previous


def path(previous, source, target):
    nodes, edges = [target], []
    while nodes[0] != source:
        parent, edge = previous[nodes[0]]
        nodes.insert(0, parent)
        edges.insert(0, edge)
    points = []
    for a, edge in zip(nodes, edges):
        if 'geometrySvg' not in edge:
            continue
        geometry = edge['geometrySvg'] if edge['source'] == a.split(':')[1] else edge['geometrySvg'][::-1]
        points.extend(geometry[bool(points):])
    return nodes, edges, points


def turn_count(points):
    turns = 0
    for a, b, c in zip(points, points[1:], points[2:]):
        first = math.atan2(b[1] - a[1], b[0] - a[0])
        second = math.atan2(c[1] - b[1], c[0] - b[0])
        angle = (math.degrees(second - first) + 180) % 360 - 180
        turns += abs(angle) >= 35
    return turns


def main():
    failures = []
    floor_counts = {}
    for floor_id, floor in DATA['floors'].items():
        nodes = {node['id']: node for node in floor['nodes']}
        rooms = plan_rooms(floor_id)
        count = 0
        for edge in floor['edges']:
            if not edge['routingEnabled']:
                continue
            count += 1
            points = edge['geometrySvg']
            if not points or points[0] != [nodes[edge['source']]['x'], nodes[edge['source']]['y']]:
                failures.append(f'{floor_id}:{edge["id"]} source coordinate')
            if not points or points[-1] != [nodes[edge['target']]['x'], nodes[edge['target']]['y']]:
                failures.append(f'{floor_id}:{edge["id"]} target coordinate')
            if abs(length(points) * SCALE - edge['distanceM']) > 0.15:
                failures.append(f'{floor_id}:{edge["id"]} length mismatch')
            for room_id, rect in rooms:
                if crosses_rect_interior(points, rect):
                    failures.append(f'{floor_id}:{edge["id"]} enters {room_id}')
        floor_counts[floor_id] = count

    for link in DATA['verticalLinks']:
        if not link['routingEnabled']:
            continue
        for end, floor_key, node_key in (
            ('from', 'sourceFloor', 'sourceGraphNodeId'),
            ('to', 'targetFloor', 'targetGraphNodeId'),
        ):
            floor = DATA['floors'][link[end][floor_key]]
            if link[end][node_key] not in {node['id'] for node in floor['nodes']}:
                failures.append(f'{link["id"]} missing {end} node')
        if link['kind'] == 'escalator' and link['direction'] == 'unknown':
            failures.append(f'{link["id"]} unverified escalator enabled')

    before, before_previous = shortest(graph_edges(baseline=True), '3F:C01')
    after, after_previous = shortest(graph_edges(), '3F:C01')
    accessible, _ = shortest(graph_edges(elevator_only=True), '3F:C01')
    source, target = '3F:C01', '3F:P26'
    old_nodes, old_edges, old_points = path(before_previous, source, target)
    new_nodes, new_edges, new_points = path(after_previous, source, target)
    if new_nodes != ['3F:C01', '3F:H06', '3F:H07', '3F:P26']:
        failures.append(f'MaruNova route: {new_nodes}')
    if length(new_points) * SCALE - after[target][1] > 0.15:
        failures.append('MaruNova polyline distance mismatch')
    if target not in accessible:
        failures.append('MaruNova not reachable without stairs')
    matrix = DATA['routes']['allPairsTimeOptimal']
    row = matrix['timeSeconds'][matrix['nodeOrder'].index(source)]
    for index, key in enumerate(matrix['nodeOrder']):
        if row[index] != (after[key][0] if key in after else None):
            failures.append(f'all-pairs matrix stale at {key}')
            break
    immediate_backtracks = []
    for key in after:
        if not key.startswith('3F:') or key == source:
            continue
        _, _, points = path(after_previous, source, key)
        if any(a == c and a != b for a, b, c in zip(points, points[1:], points[2:])):
            immediate_backtracks.append(key)
    if immediate_backtracks:
        failures.append(f'immediate polyline backtracks: {immediate_backtracks}')

    groups = {}
    for floor_id in ('1F', '2F', '3F', '4F'):
        targets = [key for key in after if key.startswith(f'{floor_id}:')]
        comparison = Counter(
            'improved' if after[key][0] < before[key][0] - 0.01
            else 'worse' if after[key][0] > before[key][0] + 0.01 else 'unchanged'
            for key in targets if key in before
        )
        groups[floor_id] = {
            'nodes': len(DATA['floors'][floor_id]['nodes']),
            'enabledEdges': floor_counts[floor_id],
            'reachableFrom3FC01': len(targets),
            'improved': comparison['improved'], 'worse': comparison['worse'],
            'unchanged': comparison['unchanged'],
            'elevatorOnlyReachable': sum(key in accessible for key in targets),
        }
    print(json.dumps({
        'marunova': {
            'before': {'nodes': old_nodes, 'edgeIds': [e['id'] for e in old_edges],
                       'polyline': old_points, 'meters': before[target][1],
                       'seconds': before[target][0], 'turns': turn_count(old_points)},
            'after': {'nodes': new_nodes, 'edgeIds': [e['id'] for e in new_edges],
                      'polyline': new_points, 'meters': after[target][1],
                      'seconds': after[target][0], 'turns': turn_count(new_points)},
        },
        'floors': groups, 'unreachableFrom3FC01': len(graph_edges()) - len(after),
        'failures': failures,
    }, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
