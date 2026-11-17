import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fetchFestivals, selectFestivals } from '../festival.js';
import { shortestPath } from '../public/station-route-math.js';

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
