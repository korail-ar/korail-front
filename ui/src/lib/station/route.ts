import { STATION, findNode } from './data';
import type { MapPoint, Route, StationData } from './types';

// 짐을 든 역 이용객 기준 걷는 속도(m/분). 시간은 항상 "약"을 붙여 보여준다.
const WALKING_METERS_PER_MINUTE = 60;

type Adjacency = Map<string, { to: string; length: number }[]>;

function buildAdjacency(data: StationData): Adjacency {
  const adjacency: Adjacency = new Map(data.nodes.map((node) => [node.id, []]));
  data.edges.forEach(({ source, target, length }) => {
    adjacency.get(source)?.push({ to: target, length });
    adjacency.get(target)?.push({ to: source, length });
  });
  return adjacency;
}

const ADJACENCY = buildAdjacency(STATION);

/** 다익스트라. 노드가 77개뿐이라 우선순위 큐 없이 매번 가장 가까운 노드를 고른다. */
export function findShortestPath(
  fromId: string,
  toId: string,
  adjacency: Adjacency = ADJACENCY,
): { nodeIds: string[]; length: number } | null {
  if (!adjacency.has(fromId) || !adjacency.has(toId)) {
    return null;
  }
  const distances = new Map<string, number>([[fromId, 0]]);
  const previous = new Map<string, string>();
  const visited = new Set<string>();

  while (visited.size < adjacency.size) {
    let current: string | null = null;
    distances.forEach((distance, id) => {
      if (!visited.has(id) && (current === null || distance < (distances.get(current) ?? 0))) {
        current = id;
      }
    });
    if (current === null || current === toId) {
      break;
    }
    const currentId: string = current;
    visited.add(currentId);
    const base = distances.get(currentId) ?? 0;
    adjacency.get(currentId)?.forEach(({ to, length }) => {
      const next = base + length;
      if (next < (distances.get(to) ?? Infinity)) {
        distances.set(to, next);
        previous.set(to, currentId);
      }
    });
  }

  if (!distances.has(toId)) {
    return null;
  }
  const nodeIds = [toId];
  while (nodeIds[0] !== fromId) {
    nodeIds.unshift(previous.get(nodeIds[0]) as string);
  }
  return { nodeIds, length: distances.get(toId) ?? 0 };
}

export function toMeters(length: number): number {
  return length * STATION.metersPerUnit;
}

export function toMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALKING_METERS_PER_MINUTE));
}

/** 10m 단위로 반올림한 거리(짧으면 5m 단위). 정확한 값처럼 보이지 않게 한다. */
export function roundMeters(meters: number): number {
  const unit = meters < 50 ? 5 : 10;
  return Math.max(unit, Math.round(meters / unit) * unit);
}

export function findRoute(fromNodeId: string, toNodeId: string): Route | null {
  const path = findShortestPath(fromNodeId, toNodeId);
  if (!path) {
    return null;
  }
  const points = path.nodeIds.map((id): MapPoint => {
    const node = findNode(id);
    return [node?.x ?? 0, node?.y ?? 0];
  });
  const meters = toMeters(path.length);
  return { nodeIds: path.nodeIds, points, meters, minutes: toMinutes(meters) };
}
