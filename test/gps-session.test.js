import test from 'node:test';
import assert from 'node:assert/strict';
import { browserLocationProvider } from '../public/location-provider.js';
import { withEdgeStart, nearestReachablePlace, routeToPlace, sessionCsv, sessionSummary } from '../public/gps-session.js';

test('브라우저 공급자는 위치를 전달하고 watcher를 정확히 한 번 정리한다', () => {
  const oldSecure = globalThis.isSecureContext;
  globalThis.isSecureContext = true;
  let received, cleared = 0;
  const provider = browserLocationProvider({ watchPosition(callback) { callback({ coords: { latitude: 36, longitude: 127, accuracy: 18, heading: null, speed: null }, timestamp: 123 }); return 7; }, clearWatch(id) { assert.equal(id, 7); cleared++; } });
  try {
    const stop = provider.subscribe(sample => { received = sample; }, () => {});
    assert.deepEqual(received, { latitude: 36, longitude: 127, accuracy: 18, heading: null, speed: null, timestamp: 123 });
    stop(); assert.equal(cleared, 1);
  } finally { globalThis.isSecureContext = oldSecure; }
});

test('일방통행 엣지 중간에서 비용 단위를 유지하고 도달 가능한 시설만 추천한다', () => {
  const graph = { weightUnit: 's', nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 10, y: 0 }, { id: 'c', x: 20, y: 0 }], edges: [{ id: 'ab', source: 'a', target: 'b', weight: 10, selectedDistanceM: 10, bidirectional: false }, { id: 'bc', source: 'b', target: 'c', weight: 10, selectedDistanceM: 10, bidirectional: true }], places: [{ id: 'back', name: '뒤', nodeId: 'a' }, { id: 'forward', name: '앞', nodeId: 'b' }, { id: 'far', name: '멀리', nodeId: 'c' }] };
  const match = { edge: graph.edges[0], t: 0.5, x: 5, y: 0 };
  assert.equal(withEdgeStart(graph, match).edges.length, 3);
  assert.equal(nearestReachablePlace(graph, match).place.id, 'forward');
  assert.equal(routeToPlace(graph, match, graph.places[1]).route.estimatedTimeSeconds, 5);
  assert.equal(routeToPlace(graph, match, graph.places[0]), null);
  assert.equal(graph.nodes.length, 3);
});

test('CSV는 필드 구분 문자를 이스케이프한다', () => {
  assert.match(sessionCsv([{ state: '위치, "확인"' }]), /"위치, ""확인"""/);
  assert.match(sessionCsv([]).split('\r\n')[0], /rawX,rawY,x,y,correctionDx,correctionDy,positionBasis/);
  assert.match(sessionCsv([]).split('\r\n')[0], /matchReason,routeActive,destinationId,previousRouteEdgeIds,routeEdgeIds,routeChangeReason,routeDistanceSvg/);
  assert.match(sessionCsv([]).split('\r\n')[0], /stepCount,strideM,stepDistanceM,stepX,stepY/);
  assert.match(sessionCsv([]).split('\r\n')[0], /routeDistanceMApprox,onRouteEdge,routeRelation,direction/);
  assert.equal(sessionSummary([{ eventType: 'manual-anchor' }, { eventType: 'sample', accuracy: 20 }], {}).samples, 1);
});
