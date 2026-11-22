import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('내 위치 구독은 실시간 갱신되고 종료 시 정리된다', async () => {
  const html = await readFile(new URL('../public/gps-test.html', import.meta.url), 'utf8');
  const settings = JSON.parse(await readFile(new URL('../public/gps-calibration.json', import.meta.url)));
  const points = JSON.parse(await readFile(new URL('../public/gps-points.json', import.meta.url)));
  const dom = new JSDOM(html, { url: 'https://example.test/gps-test.html' });
  const originals = Object.fromEntries(['window', 'document', 'navigator', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const interval = globalThis.setInterval;
  let success, clearCount = 0, watchCount = 0;
  const requested = [];
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation: { watchPosition(callback) { success = callback; watchCount++; return watchCount; }, clearWatch() { clearCount++; } } } });
    Object.defineProperty(dom.window, 'isSecureContext', { configurable: true, value: true });
    globalThis.setInterval = () => 1;
    globalThis.fetch = async path => { requested.push(path); return { ok: true, json: async () => path.includes('calibration') ? settings : points }; };
    await import(`../public/gps-diagnostics.js?test=${Date.now()}`);
    assert.deepEqual(requested, ['/gps-calibration.json', '/gps-points.json']);
    document.getElementById('experimental').checked = true;
    document.getElementById('gpsOn').click();
    assert.equal(watchCount, 1);
    const emit = latitude => success({ coords: { latitude, longitude: 127.434, accuracy: 5 }, timestamp: Date.now() });
    emit(36.332);
    assert.match(document.getElementById('gpsStatus').textContent, /실시간 GPS.*추정 위치/);
    const first = document.querySelector('#gpsLayer circle:last-of-type').getAttribute('cx');
    emit(36.33201);
    assert.notEqual(document.querySelector('#gpsLayer circle:last-of-type').getAttribute('cx'), first);
    document.getElementById('gpsOff').click();
    assert.equal(clearCount, 1);
    assert.equal(document.getElementById('gpsLayer').children.length, 0);
  } finally {
    globalThis.setInterval = interval;
    for (const [key, descriptor] of Object.entries(originals)) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
    dom.window.close();
  }
});
