import test from 'node:test';
import assert from 'node:assert/strict';
import { constrainToFloor, routeProjection, navigationDecision } from '../public/gps-navigation.js';

test('층 도면 밖 추정은 경계 제한 상태를 함께 반환한다', () => {
  assert.deepEqual(constrainToFloor({ x: -20, y: 120 }, [0, 0, 100, 100]), { x: 0, y: 100, limited: true });
  assert.deepEqual(constrainToFloor({ x: 40, y: 30 }, [0, 0, 100, 100]), { x: 40, y: 30, limited: false });
});
test('경로 중간 투영과 방향, 3회 연속 이탈 후 재탐색', () => {
  const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
  const first = { ...routeProjection(path, { x: 20, y: 3 }), x: 20, y: 3, timestamp: 1000 };
  assert.equal(first.progress, 20);
  assert.equal(first.distance, 3);
  const forward = { ...routeProjection(path, { x: 45, y: 4 }), x: 45, y: 4, timestamp: 2000 };
  assert.equal(navigationDecision(first, forward, 5, 0, true).direction, '경로 방향 이동 추정');
  assert.equal(navigationDecision(forward, { ...first, timestamp: 3000 }, 5, 0, true).direction, '반대 방향 이동 추정');
  assert.equal(navigationDecision(forward, first, 5, 0, true).direction, '방향 판단 보류');
  const away = { ...routeProjection(path, { x: 45, y: 50 }), x: 45, y: 50, timestamp: 3000 };
  assert.equal(navigationDecision(forward, away, 5, 1, true).reroute, false);
  assert.equal(navigationDecision(forward, away, 5, 2, true).reroute, true);
  assert.equal(navigationDecision(forward, away, 50, 2, true).reroute, false);
  assert.equal(navigationDecision(forward, away, 5, 2, false).reroute, false);
});
