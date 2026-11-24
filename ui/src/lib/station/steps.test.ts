import { describe, expect, it } from 'vitest';

import { DEFAULT_START, findPlace } from './data';
import { findRoute } from './route';
import { buildSteps, splitLegs } from './steps';
import type { MapPoint, StationPlace } from './types';

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
    expect(steps.at(-1)).toMatchObject({ kind: 'arrive', text: '매표소(매표실)에 도착' });
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
