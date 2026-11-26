"""Audit every ordered node pair in NORMAL and ACCESSIBLE graph modes.

This is a data-level fallback audit. SVG-only walkability remains UNVERIFIED until
surveyed; browser routing and independent Grid A* have separate integration tests.
Run from ui/: python scripts/navigation-regression.py
"""

import heapq
import json
import math
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = json.loads((ROOT / 'src/data/daejeon_routes_calculated.json').read_text(encoding='utf-8'))
MIGRATED = json.loads((ROOT / 'src/data/navigation/graph.generated.json').read_text(encoding='utf-8'))
OUTPUT = ROOT / 'reports/navigation-quality.json'


def graph(data, mode):
    result = {f'{floor}:{node["id"]}': [] for floor, item in data['floors'].items()
              for node in item['nodes']}
    for floor, item in data['floors'].items():
        for edge in item['edges']:
            if not edge['routingEnabled']:
                continue
            a, b = f'{floor}:{edge["source"]}', f'{floor}:{edge["target"]}'
            result[a].append((b, edge['distanceM'], edge['timeSeconds'], floor, edge))
            result[b].append((a, edge['distanceM'], edge['timeSeconds'], floor, edge))
    for link in data['verticalLinks']:
        if not link['routingEnabled'] or mode == 'ACCESSIBLE' and link['kind'] != 'elevator':
            continue
        a = f'{link["from"]["sourceFloor"]}:{link["from"]["sourceGraphNodeId"]}'
        b = f'{link["to"]["targetFloor"]}:{link["to"]["targetGraphNodeId"]}'
        result[a].append((b, link['distanceMIncludingApproach'],
                          link['dijkstraWeightSeconds']['sourceToTarget'], None, link))
        if link['direction'] == 'both':
            result[b].append((a, link['distanceMIncludingApproach'],
                              link['dijkstraWeightSeconds']['targetToSource'], None, link))
    return result


def shortest_paths(adjacency, source):
    best = {source: (0.0, 0.0)}
    previous = {}
    queue = [(0.0, 0.0, source)]
    while queue:
        meters, seconds, node = heapq.heappop(queue)
        if (meters, seconds) != best[node]:
            continue
        for target, extra_meters, extra_seconds, floor, edge in adjacency[node]:
            candidate = (round(meters + extra_meters, 4), round(seconds + extra_seconds, 3))
            if candidate < best.get(target, (math.inf, math.inf)):
                best[target] = candidate
                previous[target] = (node, floor, edge)
                heapq.heappush(queue, (*candidate, target))
    return best, previous


def path_metrics(previous, source, target):
    nodes = [target]
    edges = []
    while nodes[0] != source:
        parent, floor, edge = previous[nodes[0]]
        edges.insert(0, (parent, floor, edge))
        nodes.insert(0, parent)
    points_by_floor = []
    transfers = 0
    for parent, floor, edge in edges:
        if floor is None:
            transfers += 1
            points_by_floor.append([])
            continue
        geometry = edge['geometrySvg'] if edge['source'] == parent.split(':')[1] else edge['geometrySvg'][::-1]
        if not points_by_floor or not points_by_floor[-1]:
            points_by_floor.append(list(geometry))
        else:
            points_by_floor[-1].extend(geometry[1:])
    turns = 0
    for points in points_by_floor:
        for a, b, c in zip(points, points[1:], points[2:]):
            first = math.atan2(b[1] - a[1], b[0] - a[0])
            second = math.atan2(c[1] - b[1], c[0] - b[0])
            angle = (math.degrees(second - first) + 180) % 360 - 180
            turns += abs(angle) >= 35
    return len(nodes), sum(len(points) for points in points_by_floor), turns, transfers


def main():
    records = []
    summary = {}
    failures = []
    for mode in ('NORMAL', 'ACCESSIBLE'):
        old_graph = graph(BASELINE, mode)
        new_graph = graph(MIGRATED, mode)
        counts = Counter()
        times = []
        for source in new_graph:
            started = time.perf_counter()
            current, previous = shortest_paths(new_graph, source)
            baseline, _ = shortest_paths(old_graph, source) if source in old_graph else ({}, {})
            times.append((time.perf_counter() - started) * 1000)
            for target in new_graph:
                if source == target:
                    continue
                old = baseline.get(target)
                found = current.get(target)
                if found is None:
                    status = 'EXPECTED_UNREACHABLE' if old is None else 'FAIL'
                    counts[status] += 1
                    if status == 'FAIL':
                        failures.append(f'{mode}: {source} -> {target} lost a route')
                    records.append({'mode': mode, 'start': source, 'destination': target,
                                    'status': status, 'before': old, 'after': None})
                    continue
                nodes, points, turns, transfers = path_metrics(previous, source, target)
                status = 'UNVERIFIED'  # floor-plan evidence is not a field walkability survey
                if mode == 'ACCESSIBLE' and any(
                    floor is None and edge['kind'] != 'elevator'
                    for _, floor, edge in path_edges(previous, source, target)
                ):
                    status = 'FAIL'
                    failures.append(f'{mode}: {source} -> {target} uses non-elevator transfer')
                if old is not None and found[0] > old[0] + 0.2:
                    status = 'FAIL'
                    failures.append(f'{mode}: {source} -> {target} distance regression')
                counts[status] += 1
                records.append({'mode': mode, 'start': source, 'destination': target,
                                'status': status, 'before': old,
                                'after': {'distanceMeters': found[0], 'estimatedSeconds': found[1],
                                          'nodeCount': nodes, 'geometryPointCount': points,
                                          'turnCount': turns, 'floorTransferCount': transfers}})
        summary[mode] = {'pairs': sum(counts.values()), 'statusCounts': dict(counts),
                         'meanSearchMs': round(sum(times) / len(times), 3),
                         'maxSearchMs': round(max(times), 3)}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({'schemaVersion': 1, 'summary': summary,
                                  'failures': failures, 'routes': records}, ensure_ascii=False,
                                 separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({'summary': summary, 'failures': failures[:10],
                      'report': str(OUTPUT)}, ensure_ascii=False, indent=2))
    if failures:
        raise SystemExit(1)


def path_edges(previous, source, target):
    edges = []
    while target != source:
        parent, floor, edge = previous[target]
        edges.append((parent, floor, edge))
        target = parent
    return edges


if __name__ == '__main__':
    main()
