import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildStationRoute } from '../public/multi-floor-route.js';

const graphs = new Map(await Promise.all([1,2,3].map(async floor => [floor,JSON.parse(await readFile(new URL(`../public/assets/json/floor-${floor}-graph.json`, import.meta.url),'utf8'))])));
const from = { id:'3F-P21',floor:3,name:'매표소' };
const to = { id:'1F-P03',floor:1,name:'예산국수' };

test('매표소에서 예산국수까지 기본 계단 경로를 층별로 계산한다', () => {
  const plan = buildStationRoute(graphs,from,to);
  assert.ok(plan);
  assert.deepEqual(plan.segments.map(segment=>segment.floor),[3,2,1]);
  assert.deepEqual(plan.segments.map(segment=>segment.end.id),['3F-P14','2F-P07','1F-P03']);
  assert.ok(plan.segments.every(segment=>segment.route.reachable));
  assert.ok(plan.estimatedTimeSeconds > 0);
  assert.equal(plan.provisionalVerticalConnection,true);
});

test('교통약자 경로는 계단 대신 승강기 연결 후보를 사용한다', () => {
  const plan = buildStationRoute(graphs,from,to,true);
  assert.ok(plan);
  assert.deepEqual(plan.segments.map(segment=>segment.floor),[3,2,1]);
  assert.deepEqual(plan.segments.map(segment=>segment.end.id),['3F-P16','2F-P04','1F-P03']);
  assert.ok(plan.segments.every(segment=>segment.route.reachable));
  assert.equal(plan.accessible,true);
});
