import { describe, expect, it } from 'vitest';

import { PLATFORMS, START_POINTS, STATION, findPlace } from './data';
import { findRoute, findShortestPath, roundMeters, toMinutes } from './route';

describe('findShortestPath', () => {
  const adjacency = new Map([
    [
      'A',
      [
        { to: 'B', length: 1 },
        { to: 'C', length: 5 },
      ],
    ],
    [
      'B',
      [
        { to: 'A', length: 1 },
        { to: 'C', length: 1 },
      ],
    ],
    [
      'C',
      [
        { to: 'A', length: 5 },
        { to: 'B', length: 1 },
      ],
    ],
    ['D', []],
  ]);

  it('가장 짧은 길을 고른다', () => {
    expect(findShortestPath('A', 'C', adjacency)).toEqual({ nodeIds: ['A', 'B', 'C'], length: 2 });
  });

  it('출발과 도착이 같으면 길이 0', () => {
    expect(findShortestPath('A', 'A', adjacency)).toEqual({ nodeIds: ['A'], length: 0 });
  });

  it('이어지지 않았거나 없는 노드면 null', () => {
    expect(findShortestPath('A', 'D', adjacency)).toBeNull();
    expect(findShortestPath('A', 'Z', adjacency)).toBeNull();
  });
});

describe('거리·시간 표기', () => {
  it('시간은 최소 1분', () => {
    expect(toMinutes(10)).toBe(1);
    expect(toMinutes(150)).toBe(3);
  });

  it('거리는 5m·10m 단위로 반올림한다', () => {
    expect(roundMeters(2)).toBe(5);
    expect(roundMeters(43)).toBe(45);
    expect(roundMeters(124)).toBe(120);
  });
});

describe('3층 그래프 데이터', () => {
  it('모든 QR 출발 위치에서 위치를 아는 모든 시설까지 길이 있다', () => {
    const routable = STATION.places.filter((place) => place.routeNodeId);
    START_POINTS.forEach((start) => {
      routable.forEach((place) => {
        expect(findRoute(start.nodeId, place.routeNodeId as string), place.name).not.toBeNull();
      });
    });
  });

  it('운행 중인 타는 곳은 모두 승강장 연결통로로 이어진다', () => {
    PLATFORMS.filter((platform) => platform.isInService).forEach((platform) => {
      expect(findPlace(platform.placeId)?.category).toBe('platform_access');
    });
  });

  it('지도에 있는 시설은 좌표가 지도 범위 안에 있다', () => {
    const [x, y, width, height] = STATION.viewBox;
    STATION.places
      .filter((place) => place.onMap)
      .forEach((place) => {
        expect(place.x).toBeGreaterThanOrEqual(x);
        expect(place.x).toBeLessThanOrEqual(x + width);
        expect(place.y).toBeGreaterThanOrEqual(y);
        expect(place.y).toBeLessThanOrEqual(y + height);
      });
  });
});
