import test from 'node:test';
import assert from 'node:assert/strict';
import { fitAffine, project, unproject } from '../public/station-route-math.js';
import { calibration, validPosition, smoothPosition, edgeCandidates, matchEdge, routeFromEdge, distanceToPolyline } from '../public/gps-location.js';
const origin = { lat: 36.33, lng: 127.43 };
const anchors = [
  { ...origin, x: 0, y: 0, role: 'training', verified: true },
  { lat: 36.33, lng: 127.431, x: 100, y: 0, role: 'training', verified: true },
  { lat: 36.331, lng: 127.43, x: 0, y: 200, role: 'training', verified: true },
  { lat: 36.3305, lng: 127.4305, x: 51, y: 101, role: 'validation', verified: true }
];
test('보정, 역변환, 독립 검증 오차', () => {
  const fit = fitAffine(anchors.slice(0, 3));
  const point = project(fit, 36.3305, 127.4305);
  assert.ok(Math.abs(point[0] - 50) < 0.01);
  const reverse = unproject(fit, ...point);
  assert.ok(Math.abs(reverse.lat - 36.3305) < 1e-9);
  assert.ok(Math.abs(reverse.lng - 127.4305) < 1e-9);
  assert.ok(Math.abs(calibration({ anchors }).errors[0] - Math.SQRT2) < 0.01);
  assert.equal(calibration({ anchors: anchors.slice(0, 2) }).fit, null);
});
test('오래된 위치와 순간 이동을 거부하고 정지 흔들림을 줄인다', () => {
  const position = (latitude, timestamp) => ({ coords: { latitude, longitude: 127.43, accuracy: 5 }, timestamp });
  const now = Date.now(), first = position(36.33, now);
  assert.equal(validPosition(position(36.33, now - 16000), now), '오래된 위치');
  assert.equal(smoothPosition(first, position(36.34, now + 1000)), first);
  assert.ok(smoothPosition(first, position(36.33001, now + 1000)).coords.latitude < 36.33001);
});
test('엣지 중간 투영과 일방통행 임시 출발점', () => {
  const graph = { nodes: [{ id: 'A', x: 0, y: 0 }, { id: 'B', x: 100, y: 0 }], edges: [{ id: 'E', source: 'A', target: 'B', weight: 10, bidirectional: false, verified: true }] };
  const matches = edgeCandidates(graph, { x: 40, y: 5 }, 10);
  assert.equal(matches[0].t, 0.4);
  const match = matchEdge(graph, { x: 40, y: 5 }, 10);
  assert.equal(routeFromEdge(graph, match, 'B').weight, 6);
  assert.equal(routeFromEdge(graph, match, 'A'), null);
  assert.equal(graph.nodes.length, 2);
  assert.equal(distanceToPolyline([{ x: 0, y: 0 }, { x: 100, y: 0 }], { x: 40, y: 5 }), 5);
});

test('층별 시험 경로 자료는 같은 SVG 좌표계와 초 단위 비용을 쓴다', async () => {
  const { readFile } = await import('node:fs/promises');
  const { fastestRoute } = await import('../public/assets/json/fastest-route.mjs');
  for (let floor = 1; floor <= 4; floor++) {
    const graph = JSON.parse(await readFile(new URL(`../public/assets/json/gps-test-floor-${floor}.json`, import.meta.url)));
    assert.equal(graph.mapId, `daejeon-station-${floor}F-map.svg`);
    assert.equal(graph.weightUnit, 's');
    assert.equal(graph.routableForPublicUse, false);
    assert.equal(fastestRoute(graph, graph.places[0].nodeId, graph.places.at(-1).nodeId).reachable, true);
  }
});
