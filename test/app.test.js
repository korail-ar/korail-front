import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fetchFestivals, selectFestivals } from '../festival.js';
import { searchPlaces, shortestPath } from '../public/station-route-math.js';
import { buildRouteSteps } from '../public/route-steps.js';
import { categoryForPlace } from '../public/place-categories.js';

const event = (id, start, end) => ({
  contentid: String(id), title: `축제 ${id}`, eventstartdate: start,
  eventenddate: end, mapx: '127.3845', mapy: '36.3504', addr1: '대전'
});

test('축제 목록은 현재 및 예정 행사 최대 3개만 반환한다', () => {
  const result = selectFestivals([
    event(1, '20261110', '20261112'), event(2, '20261113', '20261113'),
    event(3, '20261111', '20261114'), event(4, '20261114', '20261115'),
    event(5, '20261116', '20261117')
  ], '20261113');
  assert.deepEqual(result.map(item => item.contentid), ['2', '3', '4']);
});

test('TourAPI 조회는 서버 키를 사용하고 사진을 함께 반환한다', async () => {
  let requested;
  const fetcher = async url => {
    requested = url;
    return { ok: true, json: async () => ({ response: { header: { resultCode: '0000' }, body: {
      totalCount: 1, items: { item: [{ ...event(1, '20261113', '20261114'), firstimage: 'https://example.com/photo.jpg' }] }
    } } }) };
  };
  const result = await fetchFestivals('test-key', new Date('2026-11-12T15:30:00Z'), fetcher);
  assert.equal(requested.searchParams.get('serviceKey'), 'test-key');
  assert.equal(requested.searchParams.get('lDongRegnCd'), '30');
  assert.equal(result[0].image, 'https://example.com/photo.jpg');
});

test('3층 지도 데이터에서 연결된 시설 사이 경로를 계산한다', async () => {
  const graph = JSON.parse(await readFile(new URL('../public/daejeon-station-3f-graph.json', import.meta.url)));
  const connected = graph.places.filter(place => place.nodeId);
  const route = shortestPath(graph, connected[0].nodeId, connected[1].nodeId);
  assert.ok(route?.ids.length >= 2);
  assert.equal(route.ids[0], connected[0].nodeId);
  assert.equal(route.ids.at(-1), connected[1].nodeId);
});

test('시설 검색은 부분 일치, 단어 순서 변경, 한 글자 오차를 허용한다', async () => {
  const graph = JSON.parse(await readFile(new URL('../public/daejeon-station-3f-graph.json', import.meta.url)));
  for (const query of ['서문 엘리베이터', '엘리 서문', '서문 엘레베이터']) {
    assert.equal(searchPlaces(graph.places, query)[0]?.nodeId, 'P43');
  }
  assert.equal(searchPlaces(graph.places, '매표')[0]?.nodeId, 'P32');
  assert.deepEqual(searchPlaces(graph.places, '없는 시설'), []);
});

test('실제 시설 데이터가 화장실·식음료·안내 카테고리로 구분된다', async () => {
  const graph = JSON.parse(await readFile(new URL('../public/daejeon-station-3f-graph.json', import.meta.url)));
  const category = name => categoryForPlace(graph.places.find(place => place.name.includes(name)));
  assert.equal(category('화장실(디자인스킨'), 'restroom');
  assert.equal(category('신청도할매김밥'), 'food');
  assert.equal(category('편의시설(지도 상단 안내'), 'information');
  assert.equal(category('매표소'), 'ticketing');
  assert.equal(categoryForPlace(graph.places.find(place => place.name === '디자인스킨')), 'shop');
  assert.deepEqual([graph.nodes.find(node => node.id === 'P40').x, graph.nodes.find(node => node.id === 'P40').y], [855, 1063]);
});

test('서광장 엘리베이터와 매표소 양방향 단계가 경로 순서와 정확히 일치한다', async () => {
  const graph = JSON.parse(await readFile(new URL('../public/daejeon-station-3f-graph.json', import.meta.url)));
  const elevator = graph.places.find(place => place.nodeId === 'P43');
  const ticket = graph.places.find(place => place.nodeId === 'P32');
  for (const [from, to] of [[elevator, ticket], [ticket, elevator]]) {
    const path = shortestPath(graph, from.nodeId, to.nodeId);
    const steps = buildRouteSteps(graph, path, from, to);
    assert.ok(steps.length >= 3);
    assert.deepEqual(steps.map(step => step.number), steps.map((_, index) => index + 1));
    assert.equal(steps[0].nodeIds[0], from.nodeId);
    assert.equal(steps.at(-1).nodeIds.at(-1), to.nodeId);
    assert.ok(steps[0].text.includes(from.name));
    assert.ok(steps.at(-1).text.includes(to.name));
    assert.ok(steps.every(step => !/약 \d+\s*(m|분)|좌회전|우회전/.test(step.text)));
    const routeEdges = path.ids.slice(1).map((id, index) => `${path.ids[index]}→${id}`);
    const stepEdges = steps.flatMap(step => step.nodeIds.slice(1).map((id, index) => `${step.nodeIds[index]}→${id}`));
    assert.deepEqual(stepEdges, routeEdges);
  }
});
