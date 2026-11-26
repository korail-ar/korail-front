"""Summarize the existing directional navigation regression by start floor."""

import collections
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
report = json.loads((root / 'reports/navigation-quality.json').read_text(encoding='utf-8'))
graph = json.loads((root / 'src/data/navigation/graph.generated.json').read_text(encoding='utf-8'))

for floor, data in graph['floors'].items():
    print(f"{floor}: {len(data['nodes'])} nodes, {len(data['edges'])} edges")
    for mode in ('NORMAL', 'ACCESSIBLE'):
        routes = [r for r in report['routes'] if r['mode'] == mode and r['start'].startswith(f'{floor}:')]
        counts = collections.Counter(r['status'] for r in routes)
        reachable = [r for r in routes if r['status'] == 'UNVERIFIED']
        cross = sum(r['start'].split(':')[0] != r['destination'].split(':')[0] for r in reachable)
        detours = [r for r in reachable if r['before'] and r['after']['distanceMeters'] > r['before'][0] * 1.1 + .01]
        print(f'  {mode}: {dict(counts)}, cross-floor reachable {cross}, >10% baseline distance {len(detours)}')
print('failures:', len(report['failures']))
