import { describe, expect, it } from 'vitest';

import { DEFAULT_START, findPlace } from './data';
import { findRoute } from './route';
import { buildJourneyMilestones, buildSteps, splitLegs } from './steps';
import type { GuideStep, MapPoint, StationPlace } from './types';

describe('splitLegs', () => {
  // 지도 좌표는 y가 아래로 커진다. 오른쪽(동)으로 가다가 아래(남)로 꺾으면 오른쪽 회전이다.
  it('크게 꺾이는 곳에서 단계를 나누고 방향을 붙인다', () => {
    const points: MapPoint[] = [
      [0, 0],
      [400, 0],
      [400, 400],
      [800, 400],
    ];
    const legs = splitLegs(points);
    expect(legs.map((leg) => leg.turn)).toEqual([null, 'right', 'left']);
    expect(legs[1].points).toEqual([
      [400, 0],
      [400, 400],
    ]);
  });

  it('조금 휘는 곳은 단계로 나누지 않는다', () => {
    const points: MapPoint[] = [
      [0, 0],
      [400, 40],
      [800, 0],
    ];
    expect(splitLegs(points)).toHaveLength(1);
  });

  it('짧은 꺾임은 앞 단계에 합친다', () => {
    const points: MapPoint[] = [
      [0, 0],
      [400, 0],
      [400, 20],
    ];
    expect(splitLegs(points)).toHaveLength(1);
  });
});

describe('buildSteps', () => {
  const ticketOffice = findPlace(32) as StationPlace;
  const route = findRoute(DEFAULT_START.nodeId, ticketOffice.routeNodeId as string);

  it('마지막 단계는 도착이다', () => {
    expect(route).not.toBeNull();
    const steps = buildSteps(route!, { startName: DEFAULT_START.name, destination: ticketOffice });
    expect(steps.at(-1)).toMatchObject({ kind: 'arrive', text: '매표소(매표실) 표지판 확인' });
    expect(steps.slice(0, -1).every((step) => step.kind === 'walk')).toBe(true);
    expect(steps[0].detail).toContain(DEFAULT_START.name);
  });

  it('타는 곳 경로는 승강장으로 내려가는 층 이동으로 끝난다', () => {
    const steps = buildSteps(route!, {
      startName: DEFAULT_START.name,
      destination: ticketOffice,
      platformNumber: 5,
    });
    expect(steps.at(-1)).toMatchObject({ kind: 'floor', text: '5번 승강장으로 내려가기' });
  });
});

describe('buildJourneyMilestones', () => {
  const walk = (landmark?: string): GuideStep => ({
    kind: 'walk',
    icon: 'arrow-up',
    text: '',
    sub: '',
    detail: '',
    points: [],
    landmark,
  });
  const arrive: GuideStep = { ...walk(), kind: 'arrive' };

  it('출발 · 경유 · 도착 세 지점을 만들고, 경유를 지날 때까지 경유가 지금이다', () => {
    const steps = [walk('플라잉스콘'), walk('플라잉스콘'), walk(), arrive];
    const journey = buildJourneyMilestones(steps, '3층 맞이방', '매표소');
    expect(journey.milestones.map((item) => [item.label, item.role])).toEqual([
      ['3층 맞이방', '출발'],
      ['플라잉스콘', '경유'],
      ['매표소', '도착'],
    ]);
    expect([0, 1, 2, 3].map(journey.currentFor)).toEqual([1, 1, 2, 2]);
  });

  it('보이는 시설이 없으면 출발 · 도착 두 지점', () => {
    const journey = buildJourneyMilestones([walk(), arrive], '3층 맞이방', '매표소');
    expect(journey.milestones).toHaveLength(2);
    expect(journey.currentFor(0)).toBe(1);
  });
});
