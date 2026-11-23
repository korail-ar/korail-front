import test from 'node:test';
import assert from 'node:assert/strict';
import { StepDetector } from '../public/location-engine/step-detector.js';
import { HeadingEstimator, cardinal, cardinalReading } from '../public/location-engine/heading-estimator.js';
import { PdrEngine } from '../public/location-engine/pdr-engine.js';
import { matchPosition } from '../public/location-engine/map-matcher.js';
import { bearingOnMap, geographicBearing, mapCompassOffset } from '../public/location-engine/map-orientation.js';
import { routeSegments, DirectionTracker } from '../public/location-engine/route-directions.js';

test('stationary rotation and isolated shake do not add steps; periodic pulses do', () => {
  const detector = new StepDetector();
  let count = 0;
  for (let t = 0; t < 3000; t += 50) count += Number(detector.push({ x: 0.05, y: 0, z: 0, timestamp: t + 1 }).step);
  assert.equal(count, 0);
  for (const at of [3200, 3750, 4300, 4850]) {
    for (let t = at; t <= at + 200; t += 50) count += Number(detector.push({ x: t === at + 50 ? 5 : 0.1, y: 0, z: 0, timestamp: t }).step);
  }
  assert.ok(count >= 2 && count <= 4);
});

test('relative heading calibration and meter-to-map movement', () => {
  const heading = new HeadingEstimator();
  heading.sample({ alpha: 0 });
  assert.equal(heading.calibrate(90), true);
  heading.sample({ alpha: 270 });
  assert.equal(heading.heading, 180);
  const pdr = new PdrEngine(); pdr.reset({ x: 10, y: 10 });
  const step = pdr.step({ heading: 90, compassHeading: 90, strideM: 0.65, pixelsPerMeter: 10, timestamp: 100, source: 'real' });
  assert.ok(Math.abs(step.pdrPoint.x - 16.5) < 1e-8);
  assert.ok(Math.abs(step.pdrPoint.y - 10) < 1e-8);
  assert.equal(step.source, 'real');
  assert.ok(Math.abs(step.eastM - 0.65) < 1e-8);
  assert.ok(Math.abs(step.northM) < 1e-8);
});

test('map matching leaves intersecting corridors ambiguous', () => {
  const graph = { nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 0 }, { id: 'c', x: 50, y: -50 }, { id: 'd', x: 50, y: 50 }], edges: [{ id: 'h', source: 'a', target: 'b', bidirectional: true }, { id: 'v', source: 'c', target: 'd', bidirectional: true }] };
  const outcome = matchPosition(graph, { x: 50, y: 0 }, { uncertaintyPx: 10 });
  assert.equal(outcome.match, null);
  assert.equal(outcome.candidates.length, 2);
});

test('east/west anchors rotate an absolute compass into map coordinates only when marked unverified', () => {
  const west = { x: 0, y: 100, lat: 36.33, lng: 127.43, candidateGps: { usableForProduction: false } };
  const east = { x: 0, y: 0, lat: 36.33, lng: 127.431, candidateGps: { usableForProduction: false } };
  assert.equal(bearingOnMap(west, east), 0);
  assert.ok(Math.abs(geographicBearing(west, east) - 90) < 0.01);
  assert.ok(Math.abs(mapCompassOffset(west, east) - 270) < 0.01);
  const heading = new HeadingEstimator(); heading.sample({ alpha: 270, absolute: true });
  assert.equal(heading.calibrateAbsolute(mapCompassOffset(west, east)), true);
  assert.ok(Math.min(heading.heading, 360 - heading.heading) < 0.01);
  east.candidateGps.usableForProduction = true;
  assert.equal(mapCompassOffset(west, east), null);
});

test('cardinal display requires absolute heading and rejects uncalibrated iPhone compass', () => {
  assert.deepEqual([0, 90, 180, 270, 359].map(cardinal), ['북', '동', '남', '서', '북']);
  const estimator = new HeadingEstimator();
  estimator.sample({ alpha: 20, absolute: false });
  assert.equal(estimator.absolute, false);
  estimator.sample({ alpha: 20, absolute: false, webkitCompassHeading: 80, webkitCompassAccuracy: -1 });
  assert.equal(estimator.absolute, false);
  estimator.sample({ alpha: 20, absolute: false, webkitCompassHeading: 80, webkitCompassAccuracy: 8 });
  assert.equal(estimator.absolute, true);
  assert.equal(estimator.accuracyDegrees, 8);
  assert.equal(cardinal(estimator.last), '동');
  assert.match(cardinalReading(80, 8), /^동/);
  assert.match(cardinalReading(45, 8), /^방위 불확실/);
});

test('Dijkstra route geometry becomes cardinal legs and sustained walking mismatch raises suspicion', () => {
  const segments = routeSegments([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 0);
  assert.deepEqual(segments.map(segment => segment.cardinal), ['동', '남']);
  const tracker = new DirectionTracker();
  const aligned = tracker.observe({ segments, point: { x: 30, y: 0 }, compassBearing: 115, accuracyDegrees: 10 });
  assert.equal(aligned.status, '경로 방향과 대체로 일치');
  let mismatch;
  for (let i = 0; i < 3; i++) mismatch = tracker.observe({ segments, point: { x: 30, y: 0 }, compassBearing: 270, accuracyDegrees: 10 });
  assert.equal(mismatch.status, '경로 이탈 의심 · 방향 불일치 지속');
  assert.equal(mismatch.mismatchStreak, 3);
  const held = tracker.observe({ segments, point: { x: 30, y: 0 }, compassBearing: null, accuracyDegrees: null });
  assert.equal(held.status, '방향 판단 보류');
});

test('route turn accepts either adjacent direction at a junction', () => {
  const segments = routeSegments([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 0);
  const tracker = new DirectionTracker();
  const result = tracker.observe({ segments, point: { x: 100, y: 0 }, compassBearing: 180, accuracyDegrees: 8 });
  assert.equal(result.expected.cardinal, '남');
  assert.equal(result.status, '경로 방향과 대체로 일치');
});
