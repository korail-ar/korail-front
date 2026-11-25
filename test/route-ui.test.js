import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('원본 대전역 입체 지도와 시설 검색이 연결된다', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('/assets/daejeon-map-source/styles.css'));
  assert.ok(html.includes('/assets/daejeon-map-source/app.js'));
  assert.ok(html.includes('data-floor="all"'));
  assert.ok(html.includes('id="fromSearch"'));
  assert.ok(html.includes('id="toSearch"'));
  const dom = new JSDOM(html, { url:'http://localhost:5174/' });
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const oldFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  try {
    globalThis.window = dom.window; globalThis.document = dom.window.document;
    let focused, drawn;
    const graph = { weightUnit:'s', nodes:[{id:'A',x:10,y:10},{id:'B',x:50,y:50}], edges:[{id:'E',source:'A',target:'B',weight:60,bidirectional:true,estimatedDistanceM:72}], places:[{id:'3F-P01',x:10,y:10,candidateApproachNodeId:'A'},{id:'3F-P03',x:50,y:50,candidateApproachNodeId:'B'}] };
    globalThis.fetch = async () => ({ok:true,json:async()=>graph});
    window.daejeonPlaces = () => [{id:'3F-P01',name:'매표소',floor:3},{id:'2F-P02',name:'화장실',floor:2},{id:'3F-P03',name:'승강장',floor:3}];
    window.daejeonFocusPlace = id => { focused=id; };
    window.daejeonDrawRoute = (...args) => { drawn=args; };
    await import(`../public/map-search.js?test=${Date.now()}`);
    const input = document.getElementById('fromSearch');
    input.value = '매표'; input.dispatchEvent(new dom.window.Event('input'));
    const option = document.querySelector('#searchResults button');
    assert.ok(option); assert.match(option.textContent,/매표소/);
    assert.equal(document.getElementById('searchResults').classList.contains('open'), true);
    option.click();
    assert.equal(focused,'3F-P01');
    assert.equal(input.value,'매표소');
    assert.equal(input.getAttribute('aria-expanded'),'false');
    const to = document.getElementById('toSearch');
    to.value = '화장'; to.dispatchEvent(new dom.window.Event('input'));
    assert.equal(document.getElementById('searchResults').classList.contains('open'), true);
    document.querySelector('#searchResults button').click();
    assert.equal(focused,'2F-P02');
    document.getElementById('findRoute').click();
    await new Promise(resolve => setImmediate(resolve));
    assert.match(document.getElementById('routeStatus').textContent,/연결 경로/);
    to.value = '승강'; to.dispatchEvent(new dom.window.Event('input'));
    document.querySelector('#searchResults button').click();
    document.getElementById('findRoute').click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(drawn[0],3);
    assert.deepEqual(drawn[2].nodeIds,['A','B']);
    assert.match(document.getElementById('routeStatus').textContent,/약 1분/);
  } finally {
    oldWindow ? Object.defineProperty(globalThis,'window',oldWindow) : delete globalThis.window;
    oldDocument ? Object.defineProperty(globalThis,'document',oldDocument) : delete globalThis.document;
    oldFetch ? Object.defineProperty(globalThis,'fetch',oldFetch) : delete globalThis.fetch;
    dom.window.close();
  }
});
