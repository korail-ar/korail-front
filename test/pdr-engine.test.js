import test from 'node:test';
import assert from 'node:assert/strict';
import { StepDetector } from '../public/location-engine/step-detector.js';
import { HeadingEstimator } from '../public/location-engine/heading-estimator.js';
import { PdrEngine } from '../public/location-engine/pdr-engine.js';
import { matchPosition } from '../public/location-engine/map-matcher.js';

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
  const step = pdr.step({ heading: 90, strideM: 0.65, pixelsPerMeter: 10, timestamp: 100, source: 'real' });
  assert.ok(Math.abs(step.pdrPoint.x - 16.5) < 1e-8);
  assert.ok(Math.abs(step.pdrPoint.y - 10) < 1e-8);
  assert.equal(step.source, 'real');
});

test('map matching leaves intersecting corridors ambiguous', () => {
  const graph = { nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 0 }, { id: 'c', x: 50, y: -50 }, { id: 'd', x: 50, y: 50 }], edges: [{ id: 'h', source: 'a', target: 'b', bidirectional: true }, { id: 'v', source: 'c', target: 'd', bidirectional: true }] };
  const outcome = matchPosition(graph, { x: 50, y: 0 }, { uncertaintyPx: 10 });
  assert.equal(outcome.match, null);
  assert.equal(outcome.candidates.length, 2);
});
