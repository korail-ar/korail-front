import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('real motion pulses move the map estimate with absolute or relative orientation', async () => {
  for (const absolute of [true, false]) {
  const html = await readFile(new URL('../public/pdr-test.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/pdr-test.html' });
  const keys = ['window', 'document', 'fetch', 'DeviceMotionEvent', 'DeviceOrientationEvent', 'screen', 'setTimeout'];
  const originals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const graph = { floor: 3, mapId: 'daejeon-station-3F-map.svg', weightUnit: 's', nodes: [{ id: 'A', x: 100, y: 100 }, { id: 'B', x: 100, y: 0 }], edges: [{ id: 'AB', source: 'A', target: 'B', weight: 10, selectedDistanceM: 10, bidirectional: true, verified: false }], places: [{ id: 'P1', name: '출발', x: 100, y: 100, nodeId: 'A' }, { id: 'P2', name: '도착', x: 100, y: 0, nodeId: 'B' }] };
  const points = { points: [
    { floor: 3, name: '서광장', x: 100, y: 100, candidateGps: { lat: 36.33, lng: 127.43, usableForProduction: false } },
    { floor: 3, name: '동광장', x: 100, y: 0, candidateGps: { lat: 36.33, lng: 127.431, usableForProduction: false } }
  ] };
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document });
    Object.defineProperty(dom.window, 'isSecureContext', { configurable: true, value: true });
    const Motion = class { static requestPermission() { return Promise.resolve('granted'); } };
    const Orientation = class { static requestPermission() { return Promise.resolve('granted'); } };
    Object.defineProperty(globalThis, 'DeviceMotionEvent', { configurable: true, value: Motion });
    Object.defineProperty(globalThis, 'DeviceOrientationEvent', { configurable: true, value: Orientation });
    Object.defineProperty(dom.window, 'DeviceMotionEvent', { configurable: true, value: Motion });
    Object.defineProperty(dom.window, 'DeviceOrientationEvent', { configurable: true, value: Orientation });
    Object.defineProperty(globalThis, 'screen', { configurable: true, value: { orientation: { angle: 0 } } });
    Object.defineProperty(globalThis, 'setTimeout', { configurable: true, value: () => 1 });
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async path => ({ ok: true, json: async () => path.includes('gps-points') ? points : graph }) });
    await import(`../public/pdr-test.js?test=${Date.now()}`);
    await new Promise(resolve => setImmediate(resolve));
    document.getElementById('homeStart').click();
    await new Promise(resolve => setImmediate(resolve));
    const orientation = new dom.window.Event('deviceorientation');
    Object.defineProperties(orientation, { alpha: { value: 270 }, absolute: { value: absolute } });
    dom.window.dispatchEvent(orientation);
    const initial = Number(document.querySelectorAll('#positionLayer circle')[1].getAttribute('cy'));
    let firstZoomViewBox = null, firstZoomPointY = null;
    for (let i = 0; i < 5; i++) {
      for (let t = 0; t <= 200; t += 50) {
        const motion = new dom.window.Event('devicemotion');
        Object.defineProperties(motion, { acceleration: { value: { x: t === 50 ? 5 : 0.1, y: 0, z: 0 } }, timeStamp: { value: 1000 + i * 600 + t } });
        dom.window.dispatchEvent(motion);
      }
      if (i === 1) {
        firstZoomViewBox = document.getElementById('map').getAttribute('viewBox');
        firstZoomPointY = Number(document.querySelectorAll('#positionLayer circle')[1].getAttribute('cy'));
      }
    }
    assert.ok(Number(document.getElementById('steps').textContent) >= 2);
    const moved = Number(document.querySelectorAll('#positionLayer circle')[1].getAttribute('cy'));
    assert.ok(moved < initial, `expected map y to decrease: ${initial} -> ${moved}; ${document.getElementById('mapMovement').textContent}`);
    assert.ok(moved < firstZoomPointY, 'the point must continue moving after the first zoom');
    assert.equal(document.getElementById('map').getAttribute('viewBox'), firstZoomViewBox, 'the viewport must stay fixed while testing short walks');
    const trail = document.querySelector('#positionLayer polyline');
    assert.ok(trail, 'the movement trail must be visible');
    assert.ok(trail.getAttribute('points').split(' ').length >= 3, 'the trail must contain repeated movement positions');
    assert.ok(Number(firstZoomViewBox.split(' ')[2]) < 400, 'the short-walk view must be magnified enough to show a few steps');
    assert.match(document.getElementById('mapMovement').textContent, /이동 추정/);
    if (!absolute) {
      assert.match(document.getElementById('mapMovement').textContent, /동서남북 미확정/);
      assert.equal(document.getElementById('eastWest').textContent, '측정 대기');
      assert.equal(document.getElementById('northSouth').textContent, '측정 대기');
    }
    document.getElementById('stop').click();
  } finally {
    for (const [key, descriptor] of Object.entries(originals)) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
    dom.window.close();
  }
  }
});
