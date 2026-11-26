import { STATION } from './data';
import type { MapPoint, Route } from './types';

export const TURN_THRESHOLD_DEG = 30;
const U_TURN_THRESHOLD_DEG = 150;
const MIN_EDGE_LENGTH = 0.001;

export type InstructionType =
  | 'STRAIGHT' | 'TURN_LEFT' | 'TURN_RIGHT' | 'U_TURN'
  | 'STAIRS' | 'ESCALATOR' | 'ELEVATOR';
export type TransferType = Extract<InstructionType, 'STAIRS' | 'ESCALATOR' | 'ELEVATOR'>;

export interface NavigationNode {
  id: string;
  floor: string;
  point: MapPoint;
}

export interface NavigationEdge {
  source: string;
  target: string;
  geometry?: readonly MapPoint[];
  transfer?: TransferType;
}

export interface NavigationSegment {
  id: string;
  index: number;
  floor: string;
  targetFloor: string;
  startNodeId: string;
  endNodeId: string;
  nodeIds: string[];
  geometry: MapPoint[];
  heading: number;
  turnAngle: number;
  instructionType: InstructionType;
  instruction: string;
  landmark?: { id: string; name: string; photoUrl?: string };
}

export function getHeading(from: MapPoint, to: MapPoint): number | null {
  if (Math.hypot(to[0] - from[0], to[1] - from[1]) < MIN_EDGE_LENGTH) return null;
  return Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;
}

export function normalizeAngle(angle: number): number {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}

function instruction(type: InstructionType, landmark?: string): string {
  if (type === 'STAIRS') return '계단을 이용해 이동하세요.';
  if (type === 'ESCALATOR') return '에스컬레이터를 이용해 이동하세요.';
  if (type === 'ELEVATOR') return '엘리베이터를 이용해 이동하세요.';
  if (type === 'U_TURN') return '뒤로 돌아 통로를 따라 이동하세요.';
  if (type === 'TURN_LEFT') return '왼쪽으로 돌아 통로를 따라 이동하세요.';
  if (type === 'TURN_RIGHT') return '오른쪽으로 돌아 통로를 따라 이동하세요.';
  return landmark ? `${landmark} 방향으로 이동하세요.` : '표시된 통로를 따라 이동하세요.';
}

/** The input path is preserved; merging changes instructions, never walk geometry. */
export function generateNavigationSegments(
  path: readonly NavigationNode[],
  edges: readonly NavigationEdge[],
  options: {
    breakNodeIds?: ReadonlySet<string>;
    landmarks?: ReadonlyMap<string, { id: string; name: string; photoUrl?: string }>;
  } = {},
): NavigationSegment[] {
  if (path.length < 2) return [];
  const edgeByPair = new Map<string, NavigationEdge>();
  edges.forEach((edge) => {
    edgeByPair.set(`${edge.source}\0${edge.target}`, edge);
    edgeByPair.set(`${edge.target}\0${edge.source}`, edge);
  });
  const segments: NavigationSegment[] = [];
  let start = 0;
  let referenceHeading: number | null = null;
  let lastHeading: number | null = null;

  function emit(end: number, transfer?: TransferType) {
    if (end <= start) return;
    const nodes = path.slice(start, end + 1);
    const geometry: MapPoint[] = [nodes[0].point];
    for (let i = start; i < end; i += 1) {
      const edge = edgeByPair.get(`${path[i].id}\0${path[i + 1].id}`);
      const forward = edge?.source === path[i].id;
      let points: readonly MapPoint[] = [path[i].point, path[i + 1].point];
      if (edge?.geometry) points = forward ? edge.geometry : [...edge.geometry].reverse();
      geometry.push(...points.slice(1));
    }
    const heading = getHeading(geometry[0], geometry[geometry.length - 1])
      ?? referenceHeading ?? lastHeading ?? 0;
    const turnAngle = lastHeading === null || transfer ? 0 : normalizeAngle(heading - lastHeading);
    // SVG y increases downward: a positive signed angle is a right turn.
    let type: InstructionType = transfer ?? 'STRAIGHT';
    if (!transfer && lastHeading !== null) {
      if (Math.abs(turnAngle) >= U_TURN_THRESHOLD_DEG) type = 'U_TURN';
      else if (turnAngle >= TURN_THRESHOLD_DEG) type = 'TURN_RIGHT';
      else if (turnAngle <= -TURN_THRESHOLD_DEG) type = 'TURN_LEFT';
    }
    const landmark = options.landmarks?.get(nodes[nodes.length - 1].id);
    segments.push({
      id: `${nodes[0].id}-${nodes[nodes.length - 1].id}-${segments.length}`,
      index: segments.length,
      floor: nodes[0].floor,
      targetFloor: nodes[nodes.length - 1].floor,
      startNodeId: nodes[0].id,
      endNodeId: nodes[nodes.length - 1].id,
      nodeIds: nodes.map((node) => node.id),
      geometry,
      heading,
      turnAngle,
      instructionType: type,
      instruction: instruction(type, landmark?.name),
      landmark,
    });
    if (!transfer) lastHeading = heading;
    else lastHeading = null;
    start = end;
    referenceHeading = null;
  }

  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    const edge = edgeByPair.get(`${from.id}\0${to.id}`);
    const transfer = edge?.transfer;
    if (from.floor !== to.floor && !transfer) {
      throw new Error(`Unverified floor connection: ${from.id} to ${to.id}`);
    }
    if (transfer) {
      emit(i);
      emit(i + 1, transfer);
    } else {
      const heading = getHeading(from.point, to.point);
      if (heading !== null) {
        if (referenceHeading !== null
          && Math.abs(normalizeAngle(heading - referenceHeading)) >= TURN_THRESHOLD_DEG) {
          emit(i);
        }
        if (referenceHeading === null) referenceHeading = heading;
      }
      if (options.breakNodeIds?.has(to.id)) emit(i + 1);
    }
  }
  emit(path.length - 1);
  return segments;
}

/** Adapter for the current 3F Dijkstra result. */
export function segmentsForRoute(route: Route, destinationName?: string): NavigationSegment[] {
  const nodes = route.nodeIds.map((id, index) => ({ id, floor: '3F', point: route.points[index] }));
  const landmarks = new Map<string, { id: string; name: string }>();
  if (destinationName && nodes.length) {
    const { id } = nodes[nodes.length - 1];
    landmarks.set(id, { id, name: destinationName });
  }
  return generateNavigationSegments(nodes, STATION.edges, { landmarks });
}
