/* eslint-disable no-continue, @typescript-eslint/prefer-destructuring */
import { countMeaningfulTurns } from './geometry';
import { findNavigationRoute, navigationNode } from './navigation';
import { floorSpatialData, polylineLength, segmentWalkability } from './spatial';
import type { MapPoint } from './types';

export interface GridComparison {
  status: 'PASS' | 'UNVERIFIED' | 'POTENTIAL_DETOUR';
  graphDistanceMeters: number | null;
  gridDistanceMeters: number | null;
  graphTurns: number | null;
  gridTurns: number | null;
  ratio: number | null;
  gridPoints: MapPoint[];
  note: string;
}

const CELL_UNITS = 15;
const CLEARANCE_UNITS = 3;
const MAX_EXPANSIONS = 30000;
const GRID_DETOUR_RATIO = 1.2;

interface Cell { key: string; point: MapPoint; cost: number; estimate: number }

class CellHeap {
  private values: Cell[] = [];

  get size(): number { return this.values.length; }

  push(value: Cell): void {
    this.values.push(value);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.values[parent].estimate <= value.estimate) break;
      this.values[index] = this.values[parent];
      index = parent;
    }
    this.values[index] = value;
  }

  pop(): Cell | undefined {
    const first = this.values[0];
    const last = this.values.pop();
    if (!last || !this.values.length) return first;
    let index = 0;
    while (index * 2 + 1 < this.values.length) {
      let child = index * 2 + 1;
      if (child + 1 < this.values.length
        && this.values[child + 1].estimate < this.values[child].estimate) child += 1;
      if (last.estimate <= this.values[child].estimate) break;
      this.values[index] = this.values[child];
      index = child;
    }
    this.values[index] = last;
    return first;
  }
}

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Eight-direction A* is used only as an independent audit, never as proof of walkability. */
export function findGridAuditPath(floor: string, start: MapPoint,
  destination: MapPoint): MapPoint[] | null {
  const spatial = floorSpatialData(floor);
  if (!spatial) return null;
  if (segmentWalkability(floor, start, destination, CLEARANCE_UNITS) === 'PASS') {
    return [start, destination];
  }
  const [minX, minY, width, height] = spatial.viewBox;
  const columns = Math.ceil(width / CELL_UNITS);
  const rows = Math.ceil(height / CELL_UNITS);
  const pointFor = (column: number, row: number): MapPoint =>
    [minX + column * CELL_UNITS, minY + row * CELL_UNITS];
  const keyFor = (column: number, row: number) => `${column},${row}`;
  const open = new CellHeap();
  const best = new Map<string, number>();
  const previous = new Map<string, string>();
  const gridPoints = new Map<string, MapPoint>();
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      const column = Math.round((start[0] - minX) / CELL_UNITS) + dx;
      const row = Math.round((start[1] - minY) / CELL_UNITS) + dy;
      if (column < 0 || row < 0 || column > columns || row > rows) continue;
      const point = pointFor(column, row);
      if (segmentWalkability(floor, start, point, CLEARANCE_UNITS) !== 'PASS') continue;
      const key = keyFor(column, row);
      const cost = distance(start, point);
      best.set(key, cost);
      previous.set(key, 'START');
      gridPoints.set(key, point);
      open.push({ key, point, cost, estimate: cost + distance(point, destination) });
    }
  }
  let expansions = 0;
  while (open.size && expansions < MAX_EXPANSIONS) {
    const current = open.pop()!;
    if (current.cost !== best.get(current.key)) continue;
    expansions += 1;
    if (distance(current.point, destination) <= CELL_UNITS * 2
      && segmentWalkability(floor, current.point, destination, CLEARANCE_UNITS) === 'PASS') {
      const points = [destination];
      let key = current.key;
      while (key !== 'START') {
        points.unshift(gridPoints.get(key)!);
        key = previous.get(key)!;
      }
      points.unshift(start);
      return points;
    }
    const [column, row] = current.key.split(',').map(Number);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        if (dx === 0 && dy === 0) continue;
        const nextColumn = column + dx;
        const nextRow = row + dy;
        if (nextColumn < 0 || nextRow < 0 || nextColumn > columns || nextRow > rows) continue;
        const next = pointFor(nextColumn, nextRow);
        if (segmentWalkability(floor, current.point, next, CLEARANCE_UNITS) !== 'PASS') continue;
        const key = keyFor(nextColumn, nextRow);
        const cost = current.cost + distance(current.point, next);
        if (cost >= (best.get(key) ?? Infinity)) continue;
        best.set(key, cost);
        previous.set(key, current.key);
        gridPoints.set(key, next);
        open.push({ key, point: next, cost, estimate: cost + distance(next, destination) });
      }
    }
  }
  return null;
}

export function compareGraphAndGrid(startId: string, destinationId: string): GridComparison {
  const start = navigationNode(startId);
  const destination = navigationNode(destinationId);
  const graph = findNavigationRoute(startId, destinationId, { strategy: 'SHORTEST' });
  if (!start || !destination || start.floor !== destination.floor) {
    return { status: 'UNVERIFIED', graphDistanceMeters: graph?.metrics.distanceMeters ?? null,
      gridDistanceMeters: null, graphTurns: graph?.metrics.turnCount ?? null,
      gridTurns: null, ratio: null, gridPoints: [], note: '동일 층의 두 노드가 필요합니다.' };
  }
  const gridPoints = findGridAuditPath(start.floor, start.point, destination.point);
  const scale = floorSpatialData(start.floor)?.metersPerUnit;
  if (!graph || !gridPoints || !scale) {
    return { status: 'UNVERIFIED', graphDistanceMeters: graph?.metrics.distanceMeters ?? null,
      gridDistanceMeters: null, graphTurns: graph?.metrics.turnCount ?? null,
      gridTurns: null, ratio: null, gridPoints: [],
      note: '격자 해상도 또는 미검증 공간 때문에 독립 경로를 찾지 못했습니다.' };
  }
  const gridDistanceMeters = polylineLength(gridPoints) * scale;
  const ratio = graph.metrics.distanceMeters / gridDistanceMeters;
  return {
    status: ratio > GRID_DETOUR_RATIO ? 'POTENTIAL_DETOUR' : 'PASS',
    graphDistanceMeters: graph.metrics.distanceMeters, gridDistanceMeters,
    graphTurns: graph.metrics.turnCount, gridTurns: countMeaningfulTurns(gridPoints),
    ratio, gridPoints,
    note: '격자 결과는 누락 통로 후보이며 현장 경로의 정답으로 간주하지 않습니다.',
  };
}
