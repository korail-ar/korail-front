import { STATION } from './data';
import { buildOrthogonalRoute } from './orthogonalRoute';
import type { MapPoint, Route } from './types';

export const TURN_THRESHOLD_DEG = 30;
const U_TURN_THRESHOLD_DEG = 150;
const MIN_EDGE_LENGTH = 0.001;
const MIN_STEP_SPAN = 60;

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
  needsDataReview?: boolean;
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
  checkpointName: string;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'OTHER' | null;
  entryTurn: 'STRAIGHT' | 'LEFT' | 'RIGHT' | 'U_TURN' | null;
  nextTurn: 'STRAIGHT' | 'LEFT' | 'RIGHT' | 'U_TURN' | null;
  movementType: 'WALK' | TransferType;
  isLastStep: boolean;
  needsDataReview: boolean;
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

function cardinalDirection(heading: number, transfer?: TransferType): NavigationSegment['direction'] {
  if (transfer) return null;
  const normalized = normalizeAngle(heading);
  if (Math.abs(normalized + 90) <= 12) return 'UP';
  if (Math.abs(normalized - 90) <= 12) return 'DOWN';
  if (Math.abs(normalized) <= 12) return 'RIGHT';
  if (Math.abs(normalized) >= 168) return 'LEFT';
  return 'OTHER';
}

function turnOf(type: InstructionType, first: boolean): NavigationSegment['entryTurn'] {
  if (first || ['STAIRS', 'ESCALATOR', 'ELEVATOR'].includes(type)) return null;
  if (type === 'TURN_LEFT') return 'LEFT';
  if (type === 'TURN_RIGHT') return 'RIGHT';
  if (type === 'U_TURN') return 'U_TURN';
  return 'STRAIGHT';
}

/** The input path is preserved; merging changes instructions, never walk geometry. */
export function generateNavigationSegments(
  path: readonly NavigationNode[],
  edges: readonly NavigationEdge[],
  options: {
    breakNodeIds?: ReadonlySet<string>;
    landmarks?: ReadonlyMap<string, { id: string; name: string; photoUrl?: string }>;
    minStepSpan?: number;
    suppressUnverifiedTurns?: boolean;
  } = {},
): NavigationSegment[] {
  if (!path.length) return [];
  if (path.length === 1) {
    const node = path[0];
    const landmark = options.landmarks?.get(node.id);
    return [{
      id: `${node.id}-arrival`, index: 0, floor: node.floor, targetFloor: node.floor,
      startNodeId: node.id, endNodeId: node.id, nodeIds: [node.id], geometry: [node.point],
      heading: 0, turnAngle: 0, instructionType: 'STRAIGHT',
      instruction: landmark ? `${landmark.name}를 확인하세요.` : '현재 지점을 확인하세요.',
      checkpointName: landmark?.name ?? '현재 지점', direction: null,
      entryTurn: null, nextTurn: null, movementType: 'WALK', isLastStep: true,
      needsDataReview: false, landmark,
    }];
  }
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
    let needsDataReview = false;
    for (let i = start; i < end; i += 1) {
      const edge = edgeByPair.get(`${path[i].id}\0${path[i + 1].id}`);
      const forward = edge?.source === path[i].id;
      let points: readonly MapPoint[] = [path[i].point, path[i + 1].point];
      if (edge?.geometry) points = forward ? edge.geometry : [...edge.geometry].reverse();
      if (edge?.needsDataReview) needsDataReview = true;
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
    if (needsDataReview && !transfer) type = 'STRAIGHT';
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
      instruction: needsDataReview && !transfer
        ? '평면도에 표시된 경로를 따라 이동하세요.' : instruction(type, landmark?.name),
      checkpointName: landmark?.name ?? (transfer ? `${nodes[nodes.length - 1].floor} 도착 지점` : '다음 통로 코너'),
      direction: needsDataReview && !transfer ? 'OTHER' : cardinalDirection(heading, transfer),
      entryTurn: needsDataReview && !transfer ? null : turnOf(type, segments.length === 0),
      nextTurn: null,
      movementType: transfer ?? 'WALK',
      isLastStep: false,
      needsDataReview,
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
        const span = path.slice(start, i + 1).reduce((length, node, offset, list) => (
          offset === 0 ? length : length + Math.hypot(
            node.point[0] - list[offset - 1].point[0],
            node.point[1] - list[offset - 1].point[1],
          )
        ), 0);
        if (referenceHeading !== null
          && Math.abs(normalizeAngle(heading - referenceHeading)) >= TURN_THRESHOLD_DEG
          && (span >= (options.minStepSpan ?? 0) || from.id.includes('-corner-'))
          && !(options.suppressUnverifiedTurns && edge?.needsDataReview)) {
          emit(i);
        }
        if (referenceHeading === null) referenceHeading = heading;
      }
      if (options.breakNodeIds?.has(to.id)) emit(i + 1);
    }
  }
  emit(path.length - 1);
  return segments.map((segment, index) => ({
    ...segment,
    nextTurn: segments[index + 1]?.entryTurn ?? null,
    isLastStep: index === segments.length - 1,
  }));
}

/** Adapter for the current 3F Dijkstra result. */
export function segmentsForRoute(route: Route, destinationName?: string): NavigationSegment[] {
  const orthogonal = buildOrthogonalRoute(route);
  const nodes: NavigationNode[] = route.nodeIds.length
    ? [{ id: route.nodeIds[0], floor: '3F', point: route.points[0] }] : [];
  const edges: NavigationEdge[] = [];
  orthogonal.edges.forEach((edge) => {
    let previousId = edge.source;
    edge.points.slice(1).forEach((point, index) => {
      const last = index === edge.points.length - 2;
      const id = last ? edge.target : `${edge.source}-${edge.target}-corner-${index}`;
      nodes.push({ id, floor: '3F', point });
      edges.push({ source: previousId, target: id, needsDataReview: edge.status === 'needs_data_review' });
      previousId = id;
    });
  });
  const landmarks = new Map<string, { id: string; name: string }>();
  STATION.places.filter((place) => place.onMap && place.routeNodeId)
    .forEach((place) => {
      if (place.routeNodeId && nodes.some((node) => node.id === place.routeNodeId)) {
        landmarks.set(place.routeNodeId, { id: String(place.id), name: place.name });
      }
    });
  if (destinationName && nodes.length) {
    const { id } = nodes[nodes.length - 1];
    landmarks.set(id, { id, name: destinationName });
  }
  const breakNodeIds = new Set(nodes.filter((node) => landmarks.has(node.id)).map((node) => node.id));
  return generateNavigationSegments(nodes, edges, {
    landmarks, breakNodeIds, minStepSpan: MIN_STEP_SPAN, suppressUnverifiedTurns: true,
  });
}
