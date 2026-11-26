"""Align the draft 1F/2F walk graph to the current web floor plans.

Run from ui/: python scripts/align-combined-walk-graph.py
Control points pair draft graph coordinates with facility markers in web-xF-map.svg.
"""
import json
from pathlib import Path

import numpy as np
from scipy.interpolate import RBFInterpolator

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'src/data/daejeon_station_1to4f_combined_walk_graph.json'

# Source graph node ID: current plan marker center (SVG user coordinates).
ANCHORS = {
    '1F': {
        '1E02': (1095.3, 245.1), '1E03': (1153.3, 245.1),
        '1E04': (1213.1, 245.1), '1E05': (1051.1, 325.1),
        '1W03': (817, 1641.6), '1W04': (972.8, 1641.6),
        '1W07': (1138.3, 1630.6), '1W10': (888.2, 1755.6),
        '1W11': (1062.1, 1745.2), '1W13': (1149.5, 1814.5),
        '1W16': (475.1, 1847.8), '1W18': (703, 1892.4),
        '1W20': (1006, 1936.1),
    },
    '2F': {
        '2A01': (696.2, 1637.8), '2A02': (693.3, 1609.3),
        '2A04': (961.4, 1638.6), '2A07': (670.7, 1718.4),
        '2A10': (839.8, 1717.6), '2A12': (715.4, 1848.7),
        '2A13': (704.3, 1888.3), '2A14': (917.7, 1749.9),
        '2A15': (991.8, 1729),
    },
}


def align_floor(floor, anchors):
    nodes = {node['id']: node for node in floor['nodes']}
    source = np.array([nodes[node_id].get('sourceSvgPoint', [nodes[node_id]['x'], nodes[node_id]['y']]) for node_id in anchors], dtype=float)
    target = np.array(list(anchors.values()), dtype=float)
    # Interpolate local facility offsets while retaining the overall affine alignment.
    transform = RBFInterpolator(source, target, kernel='thin_plate_spline',
                                degree=1, smoothing=12)

    def point(xy):
        return [round(float(value), 2) for value in transform(np.array([xy], dtype=float))[0]]

    original = {node_id: tuple(node.get('sourceSvgPoint', [node['x'], node['y']])) for node_id, node in nodes.items()}
    for node_id, node in nodes.items():
        node['sourceSvgPoint'] = list(original[node_id])
        node['x'], node['y'] = point(original[node_id])
        node['verificationStatus'] = 'aligned_to_web_plan_marker_estimate'
    for edge in floor['edges']:
        edge['sourceGeometrySvg'] = edge.get('sourceGeometrySvg', edge['geometrySvg'])
        edge['geometrySvg'] = [point(xy) for xy in edge['sourceGeometrySvg']]
        edge['geometrySvg'][0] = [nodes[edge['source']]['x'], nodes[edge['source']]['y']]
        edge['geometrySvg'][-1] = [nodes[edge['target']]['x'], nodes[edge['target']]['y']]
        edge['lengthSvgUnits'] = round(sum(
            float(np.linalg.norm(np.subtract(b, a)))
            for a, b in zip(edge['geometrySvg'], edge['geometrySvg'][1:])
        ), 2)
        edge['estimatedLengthM'] = round(edge['lengthSvgUnits'] * floor['distanceScaleMetersPerSvgUnit'], 2)
        edge['verificationStatus'] = 'aligned_to_web_plan_marker_estimate'
    floor['coordinateSystem'] = 'ui/public/maps/web-' + floor['floor'] + '-map.svg viewBox'
    floor['sourceSvg'] = 'ui/public/maps/web-' + floor['floor'] + '-map.svg'
    floor['status'] = 'aligned_to_current_plan_field_walkability_review_pending'


data = json.loads(FILE.read_text(encoding='utf-8'))
for floor_id, anchors in ANCHORS.items():
    align_floor(data['floors'][floor_id], anchors)
    edges = {edge['id']: edge for edge in data['floors'][floor_id]['edges']}
    for route in data['exampleRoutes']:
        if route['floor'] != floor_id:
            continue
        length = round(sum(edges[edge_id]['lengthSvgUnits'] for edge_id in route['edgeIds']), 2)
        meters = round(length * data['floors'][floor_id]['distanceScaleMetersPerSvgUnit'])
        route['distanceSvgUnits'] = length
        route['estimatedDistanceM'] = meters
        route['estimatedMinutes'] = max(1, round(meters / data['distancePolicy']['walkingMetersPerMinute']))
        route['display'] = f"약 {route['estimatedMinutes']}분 · 약 {meters}m"
        route['verificationStatus'] = 'aligned_to_web_plan_marker_estimate'
data['coordinateAlignmentStatus'] = (
    '1F/2F/3F graph coordinates use current ui/public/maps/web-xF-map.svg viewBoxes; '
    '1F/2F walkability and 4F coordinate alignment remain unverified'
)
FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
