"""Apply floor-plan-verified 3F corridor corrections and refresh route matrices.

Run from ui/: python scripts/repair-walk-graph.py
"""

import heapq
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CALCULATED = ROOT / 'src/data/daejeon_routes_calculated.json'
COMBINED = ROOT / 'src/data/daejeon_station_1to4f_combined_walk_graph.json'


def length(points):
    return sum(math.dist(a, b) for a, b in zip(points, points[1:]))


def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def replace_edge(edges, edge_id, replacements):
    edges[:] = [edge for edge in edges if edge['id'] != edge_id and edge['id'] not in replacements]
    edges.extend(replacements.values())


def update_calculated(data):
    floor = data['floors']['3F']
    nodes = {node['id']: [node['x'], node['y']] for node in floor['nodes']}
    scale = data['method']['mapScale']['metersPerSvgUnit']
    speed = data['method']['walkingSpeedKmh'] * 1000 / 3600

    def edge(edge_id, source, target, geometry):
        meters = round(length(geometry) * scale, 4)
        seconds = round(meters / speed, 3)
        return {
            'id': edge_id, 'source': source, 'target': target,
            'geometrySvg': geometry, 'routingEnabled': True,
            'distanceM': meters, 'timeSeconds': seconds,
            'dijkstraWeightSeconds': seconds,
            'verificationStatus': 'floor_plan_corridor_reviewed_not_field_surveyed',
        }

    # E034 passed through H06 without a graph junction and overlapped E006.
    # The floor plan shows the open corridor below shops S10-S12 at y=1145.
    replace_edge(floor['edges'], 'E034', {
        'E079': edge('E079', 'C01', 'H06', [nodes['C01'], nodes['H06']]),
        'E080': edge('E080', 'H07', 'P26', [nodes['H07'], [nodes['H07'][0], nodes['P26'][1]], nodes['P26']]),
    })
    replace_edge(floor['edges'], 'E014', {
        'E081': edge('E081', 'P10', 'A02', [nodes['P10'], nodes['A02']]),
    })
    refresh_matrices(data)
    data['audit']['floorEdgeCountEnabled'] = sum(
        edge['routingEnabled'] for floor in data['floors'].values() for edge in floor['edges']
    )


def refresh_matrices(data):
    order = data['routes']['allPairsTimeOptimal']['nodeOrder']
    graph = {key: [] for key in order}
    for floor_id, floor in data['floors'].items():
        for edge in floor['edges']:
            if not edge['routingEnabled']:
                continue
            a, b = f"{floor_id}:{edge['source']}", f"{floor_id}:{edge['target']}"
            for source, target in ((a, b), (b, a)):
                graph[source].append((target, edge['timeSeconds'], edge['distanceM'], edge['id']))
    for link in data['verticalLinks']:
        if not link['routingEnabled']:
            continue
        a = f"{link['from']['sourceFloor']}:{link['from']['sourceGraphNodeId']}"
        b = f"{link['to']['targetFloor']}:{link['to']['targetGraphNodeId']}"
        meters = link['distanceMIncludingApproach']
        graph[a].append((b, link['dijkstraWeightSeconds']['sourceToTarget'], meters, link['id']))
        if link['direction'] == 'both':
            graph[b].append((a, link['dijkstraWeightSeconds']['targetToSource'], meters, link['id']))

    times, distances = [], []
    example_pairs = {(item['source'], item['target']) for item in data['routes']['examples']}
    examples = {}
    for source in order:
        best = {source: (0, 0)}
        previous = {}
        queue = [(0, 0, source)]
        while queue:
            seconds, meters, current = heapq.heappop(queue)
            if (seconds, meters) != best[current]:
                continue
            for target, extra_seconds, extra_meters, edge_id in graph[current]:
                candidate = (round(seconds + extra_seconds, 3), round(meters + extra_meters, 4))
                if candidate < best.get(target, (math.inf, math.inf)):
                    best[target] = candidate
                    previous[target] = (current, edge_id)
                    heapq.heappush(queue, (*candidate, target))
        times.append([best[key][0] if key in best else None for key in order])
        distances.append([best[key][1] if key in best else None for key in order])
        for pair in example_pairs:
            if pair[0] != source or pair[1] not in best:
                continue
            edge_ids = []
            current = pair[1]
            while current != source:
                current, edge_id = previous[current]
                edge_ids.insert(0, edge_id)
            examples[pair] = (*best[pair[1]], edge_ids)

    matrix = data['routes']['allPairsTimeOptimal']
    matrix['timeSeconds'] = times
    matrix['distanceMetersAlongTimeOptimalRoute'] = distances
    reachable = sum(value is not None for row in times for value in row) - len(order)
    matrix['reachableOrderedPairsExcludingSelf'] = reachable
    matrix['unreachableOrderedPairsExcludingSelf'] = len(order) * (len(order) - 1) - reachable
    data['audit']['unreachableOrderedPairs'] = matrix['unreachableOrderedPairsExcludingSelf']
    for item in data['routes']['examples']:
        result = examples.get((item['source'], item['target']))
        if result:
            seconds, meters, edge_ids = result
            item.update(estimatedDistanceM=round(meters, 2), estimatedTimeSeconds=round(seconds, 1),
                        displayMinutes=max(1, math.ceil(seconds / 60)), edgeIds=edge_ids)


def update_combined(data):
    floor = data['floors']['3F']
    nodes = {node['id']: [node['x'], node['y']] for node in floor['nodes']}
    scale = floor['distanceScaleMetersPerSvgUnit']

    def edge(edge_id, source, target, geometry):
        units = round(length(geometry), 2)
        return {
            'id': edge_id, 'source': source, 'target': target, 'geometrySvg': geometry,
            'lengthSvgUnits': units, 'estimatedLengthM': round(units * scale, 2),
            'verificationStatus': 'floor_plan_corridor_reviewed_not_field_surveyed',
        }

    replace_edge(floor['edges'], 'E034', {
        'E079': edge('E079', 'C01', 'H06', [nodes['C01'], nodes['H06']]),
        'E080': edge('E080', 'H07', 'P26', [nodes['H07'], [nodes['H07'][0], nodes['P26'][1]], nodes['P26']]),
    })
    replace_edge(floor['edges'], 'E014', {
        'E081': edge('E081', 'P10', 'A02', [nodes['P10'], nodes['A02']]),
    })


if __name__ == '__main__':
    calculated = json.loads(CALCULATED.read_text(encoding='utf-8'))
    combined = json.loads(COMBINED.read_text(encoding='utf-8'))
    update_calculated(calculated)
    update_combined(combined)
    save(CALCULATED, calculated)
    save(COMBINED, combined)
