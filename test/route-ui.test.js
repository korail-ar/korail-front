import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('상세 경로 선택, 지도 강조, 입력 변경 초기화가 화면에서 동작한다', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const gpsHtml = await readFile(new URL('../public/gps-test.html', import.meta.url), 'utf8');
  assert.ok(html.includes('/gps-test.html'));
  assert.ok(gpsHtml.includes('id="gpsOn"'));
  assert.ok(gpsHtml.includes('/gps-diagnostics.js'));
  assert.ok(!html.includes('id="gpsOn"'));
  const graph = JSON.parse(await readFile(new URL('../public/daejeon-station-3f-graph.json', import.meta.url)));
  const dom = new JSDOM(html, { url: 'http://localhost:5173/' });
  const oldGlobals = Object.fromEntries(['window', 'document', 'navigator', 'fetch', 'requestAnimationFrame'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
    globalThis.requestAnimationFrame = callback => callback();
    dom.window.HTMLElement.prototype.scrollTo = function (options) {
      this.scrollLeft = options.left;
      this.scrollTop = options.top;
    };
    globalThis.fetch = async url => ({
      ok: true,
      json: async () => url.includes('graph') ? graph : []
    });
    await import(`../public/station-route.js?ui-test=${Date.now()}`);
    await new Promise(resolve => setImmediate(resolve));
    Object.defineProperty(document.getElementById('scene'), 'clientWidth', { value: 2048 });
    Object.defineProperty(document.getElementById('viewport'), 'clientWidth', { value: 600 });
    Object.defineProperty(document.getElementById('viewport'), 'clientHeight', { value: 400 });

    const choose = (field, query, expected) => {
      const input = document.getElementById(field);
      input.value = query;
      input.dispatchEvent(new dom.window.Event('input'));
      const option = [...document.querySelectorAll(`#${field}Results button`)].find(button => button.textContent.includes(expected));
      assert.ok(option, `검색 결과: ${expected}`);
      option.click();
    };
    choose('from', '엘리 서문', '서광장 A');
    choose('to', '매표', '매표소');
    document.getElementById('route').click();

    assert.equal(document.getElementById('stepCount').textContent, '총 4단계');
    assert.equal(document.querySelectorAll('.step-card').length, 4);
    const mainChildren = [...document.querySelector('main').children];
    assert.ok(mainChildren.indexOf(document.getElementById('routeSummary')) < mainChildren.indexOf(document.querySelector('.map-section')));
    assert.ok(mainChildren.indexOf(document.querySelector('.map-section')) < mainChildren.indexOf(document.getElementById('routeDetails')));
    assert.equal(mainChildren.at(-1).id, 'guideControls');

    document.getElementById('guideStart').click();
    assert.equal(document.querySelector('.step-card[aria-current="step"] .step-number').textContent, '1');
    document.getElementById('guideNext').click();
    const active = document.querySelector('.step-card[aria-current="step"]');
    assert.equal(active.querySelector('.step-number').textContent, '2');
    const ids = active.dataset.nodeIds.split(',');
    const nodes = new Map(graph.nodes.map(node => [node.id, node]));
    const expectedPoints = ids.map(id => `${nodes.get(id).x},${nodes.get(id).y}`).join(' ');
    assert.equal(document.querySelector('[data-role="selected-step"]').getAttribute('points'), expectedPoints);
    const selectedNodes = ids.map(id => nodes.get(id));
    const centerX = (Math.min(...selectedNodes.map(node => node.x)) + Math.max(...selectedNodes.map(node => node.x))) / 2;
    assert.equal(document.getElementById('viewport').scrollLeft, centerX - 300);
    document.getElementById('guidePrev').click();
    assert.equal(document.querySelector('.step-card[aria-current="step"] .step-number').textContent, '1');

    const input = document.getElementById('to');
    input.value = '엘리베이터';
    input.dispatchEvent(new dom.window.Event('input'));
    assert.equal(document.getElementById('routeDetails').hidden, true);
    assert.equal(document.getElementById('routeSummary').hidden, true);
    assert.equal(document.getElementById('guideControls').hidden, true);
    assert.equal(document.querySelector('.step-card[aria-current="step"]'), null);
    assert.equal(document.querySelector('[data-role="selected-step"]'), null);

    choose('to', '매표소', '매표소');
    document.getElementById('route').click();
    document.querySelectorAll('.step-card')[2].click();
    const fromInput = document.getElementById('from');
    fromInput.value = '서문';
    fromInput.dispatchEvent(new dom.window.Event('input'));
    assert.equal(document.getElementById('routeDetails').hidden, true);
    assert.equal(document.querySelector('[data-role="selected-step"]'), null);
  } finally {
    for (const [key, descriptor] of Object.entries(oldGlobals)) {
      if (descriptor === undefined) delete globalThis[key];
      else Object.defineProperty(globalThis, key, descriptor);
    }
    dom.window.close();
  }
});
