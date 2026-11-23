import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('manual sensor values visibly move the marker on the real 3F map', async () => {
  const html = await readFile(new URL('../public/pdr-test.html', import.meta.url), 'utf8');
  const graph = JSON.parse(await readFile(new URL('../public/assets/json/gps-test-floor-3.json', import.meta.url), 'utf8'));
  const points = JSON.parse(await readFile(new URL('../public/gps-points.json', import.meta.url), 'utf8'));
  const dom = new JSDOM(html, { url: 'https://example.test/pdr-test.html' });
  const keys = ['window', 'document', 'fetch'];
  const originals = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document });
    Object.defineProperty(dom.window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async path => ({ ok: true, json: async () => path.includes('gps-points') ? points : graph }) });
    await import(`../public/pdr-test.js?manual=${Date.now()}`);
    await new Promise(resolve => setImmediate(resolve));
    document.getElementById('confirm').click();
    const marker = () => [...document.querySelectorAll('#positionLayer circle')].find(node => node.getAttribute('fill') === '#1874ca');
    const start = { x: Number(marker().getAttribute('cx')), y: Number(marker().getAttribute('cy')) };
    document.getElementById('simulate').click();
    const end = { x: Number(marker().getAttribute('cx')), y: Number(marker().getAttribute('cy')) };
    const box = document.getElementById('map').getAttribute('viewBox').split(' ').map(Number);
    const shift = { x: (end.x - start.x) / box[2] * 360, y: (end.y - start.y) / box[3] * 360 };
    console.log(JSON.stringify({ start, end, box, shiftOn360pxScreen: shift, steps: document.getElementById('steps').textContent, movement: document.getElementById('mapMovement').textContent }));
    assert.ok(Number(document.getElementById('steps').textContent) >= 8);
    assert.ok(Math.hypot(shift.x, shift.y) > 10, 'the marker should shift visibly on a 360px map');
    assert.equal(document.getElementById('mapCoordinates').textContent, `Δx ${(end.x - start.x).toFixed(1)}, Δy ${(end.y - start.y).toFixed(1)} SVG`);
    assert.match(document.getElementById('mapMovement').textContent, /모의 이동/);
  } finally {
    for (const [key, descriptor] of Object.entries(originals)) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
    dom.window.close();
  }
});
