import test from 'node:test';
import assert from 'node:assert/strict';
import { createStepDetector, routePointAtMeters } from '../public/step-assist.js';

test('정지 흔들림은 걸음으로 세지 않고 간격을 둔 보행 펄스만 센다', () => {
  const detect = createStepDetector();
  for (let t = 0; t < 300; t += 20) assert.equal(detect(9.8 + (t % 40 ? 0.1 : -0.1), t), false);
  assert.equal(detect(12, 320), true);
  assert.equal(detect(12, 340), false);
  detect(9.6, 500);
  assert.equal(detect(12, 680), true);
});

test('걸음 거리는 SVG 픽셀이 아닌 경로 엣지의 m 단위로 보간한다', () => {
  const route = { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], segments: [{ from: { x: 0, y: 0 }, to: { x: 100, y: 0 }, meters: 20 }, { from: { x: 100, y: 0 }, to: { x: 100, y: 100 }, meters: 10 }] };
  assert.deepEqual(routePointAtMeters(route, 10), { x: 50, y: 0 });
  assert.deepEqual(routePointAtMeters(route, 25), { x: 100, y: 50 });
  assert.equal(routePointAtMeters(route, -1), null);
});
