/* eslint-disable no-continue, @typescript-eslint/prefer-destructuring */
import graphData from '@/data/navigation/graph.generated.json';
import localLinkData from '@/data/navigation/local-links.generated.json';

import { countMeaningfulTurns, optimizeFloorGeometry, turnAngleDegrees } from './geometry';
import { buildNavigationInstructions, type InstructionStep } from './instructions';
import { metersPerUnit, polylineWalkability,
  type VerificationStatus } from './spatial';
import type { MapPoint } from './types';

export type TravelMode = 'NORMAL' | 'ACCESSIBLE';
export type RouteStrategy = 'SHORTEST' | 'SIMPLE';
export type ConnectorType = 'stairs' | 'escalator' | 'elevator' | 'ramp';

interface GraphNode { id: string; x: number; y: number; kind?: string }
interface GraphEdge {
  id: string;
  source: string;
  target: string;
  geometrySvg: MapPoint[];
  routingEnabled: boolean;
  distanceM: number;
  timeSeconds: number;
}
interface GraphFloor { nodes: GraphNode[]; edges: GraphEdge[] }
interface VerticalLink {
  id: string;
  kind: ConnectorType;
  direction: string;
  routingEnabled: boolean;
  connectionStatus: string;
  from: { sourceFloor: string; sourceGraphNodeId: string; sourceApproachDistanceM: number };
  to: { targetFloor: string; targetGraphNodeId: string; targetApproachDistanceM: number };
  distanceMIncludingApproach: number;
  transferTimeSeconds: { up: number; down: number };
  dijkstraWeightSeconds: { sourceToTarget: number; targetToSource: number };
}
interface NavigationGraph {
  schemaVersion: number;
  sourceSha256: string;
  method: {
    walkingSpeedKmh: number;
    verticalFacilityModel: { elevatorWaitAndDoorSecondsAssumed: number };
  };
  floors: Record<string, GraphFloor>;
  verticalLinks: VerticalLink[];
}

interface Arc {
  id: string;
  from: string;
  to: string;
  kind: 'floor' | 'transfer' | 'local';
  floor: string;
  points: MapPoint[];
  meters: number;
  seconds: number;
  verificationStatus: VerificationStatus;
  connector?: VerticalLink;
}

export interface FloorRouteSegment {
  kind: 'floor';
  floor: string;
  points: MapPoint[];
  originalPoints: MapPoint[];
  edgeIds: string[];
  distanceMeters: number;
  estimatedSeconds: number;
  verificationStatus: VerificationStatus;
}

export interface TransferRouteSegment {
  kind: 'transfer';
  id: string;
  fromFloor: string;
  toFloor: string;
  connectorType: ConnectorType;
  distanceMeters: number;
  estimatedSeconds: number;
  estimatedWaitingSeconds: number;
  verificationStatus: VerificationStatus;
}

export type RouteSegment = FloorRouteSegment | TransferRouteSegment;

export interface NavigationRoute {
  id: string;
  startId: string;
  destinationId: string;
  mode: TravelMode;
  strategy: RouteStrategy;
  originalNodeIds: string[];
  originalEdgeIds: string[];
  floorSegments: RouteSegment[];
  instructions: InstructionStep[];
  metrics: {
    distanceMeters: number;
    estimatedSeconds: number;
    walkingSeconds: number;
    verticalMovementSeconds: number;
    estimatedWaitingSeconds: number;
    turnCount: number;
    instructionCount: number;
    floorTransferCount: number;
  };
  verificationStatus: VerificationStatus;
  validation: { isValid: boolean; warnings: string[]; errors: string[] };
}

export interface RoutingOptions { mode?: TravelMode; strategy?: RouteStrategy }

const graph = graphData as unknown as NavigationGraph;
const speedMetersPerSecond = graph.method.walkingSpeedKmh * 1000 / 3600;
const SIMPLE_MAX_EXTRA_DISTANCE_RATIO = 0.1;
const TURN_COST_METERS = 3;
const DECISION_COST_METERS = 2;
const TRANSFER_COST_METERS = 2;

const nodes = new Map<string, { floor: string; point: MapPoint }>();
Object.entries(graph.floors).forEach(([floor, data]) => data.nodes.forEach((node) => {
  nodes.set(`${floor}:${node.id}`, { floor, point: [node.x, node.y] });
}));

function compare(a: RoutingState, b: RoutingState): number {
  return a.cost - b.cost || a.meters - b.meters || a.turns - b.turns;
}

class MinHeap {
  private values: RoutingState[] = [];

  get size(): number { return this.values.length; }

  push(value: RoutingState): void {
    this.values.push(value);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compare(this.values[parent], value) <= 0) break;
      this.values[index] = this.values[parent];
      index = parent;
    }
    this.values[index] = value;
  }

  pop(): RoutingState | undefined {
    const first = this.values[0];
    const last = this.values.pop();
    if (!last || this.values.length === 0) return first;
    let index = 0;
    while (index * 2 + 1 < this.values.length) {
      let child = index * 2 + 1;
      if (child + 1 < this.values.length && compare(this.values[child + 1], this.values[child]) < 0) {
        child += 1;
      }
      if (compare(last, this.values[child]) <= 0) break;
      this.values[index] = this.values[child];
      index = child;
    }
    this.values[index] = last;
    return first;
  }
}

const adjacency = new Map<string, Arc[]>([...nodes.keys()].map((id) => [id, []]));

function addArc(arc: Arc, bothDirections = true): void {
  adjacency.get(arc.from)?.push(arc);
  if (bothDirections) {
    adjacency.get(arc.to)?.push({ ...arc, from: arc.to, to: arc.from,
      points: [...arc.points].reverse() });
  }
}

Object.entries(graph.floors).forEach(([floor, data]) => data.edges.forEach((edge) => {
  if (!edge.routingEnabled) return;
  const walkability = polylineWalkability(floor, edge.geometrySvg);
  if (walkability === 'FAIL') return;
  addArc({
    id: `${floor}:${edge.id}`, from: `${floor}:${edge.source}`, to: `${floor}:${edge.target}`,
    kind: 'floor', floor, points: edge.geometrySvg, meters: edge.distanceM,
    seconds: edge.timeSeconds,
    verificationStatus: walkability === 'PASS' ? 'ESTIMATED' : 'UNVERIFIED',
  });
}));

graph.verticalLinks.forEach((link) => {
  if (!link.routingEnabled || link.direction === 'unknown') return;
  const from = `${link.from.sourceFloor}:${link.from.sourceGraphNodeId}`;
  const to = `${link.to.targetFloor}:${link.to.targetGraphNodeId}`;
  if (!nodes.has(from) || !nodes.has(to)) return;
  const arc: Arc = {
    id: link.id, from, to, kind: 'transfer', floor: link.from.sourceFloor,
    points: [], meters: link.distanceMIncludingApproach,
    seconds: link.dijkstraWeightSeconds.sourceToTarget,
    verificationStatus: 'ESTIMATED', connector: link,
  };
  addArc(arc, false);
  if (link.direction === 'both') {
    addArc({ ...arc, from: to, to: from, floor: link.to.targetFloor,
      seconds: link.dijkstraWeightSeconds.targetToSource }, false);
  }
});

interface LocalLink {
  floor: string; source: string; target: string; points: MapPoint[]; distanceM: number;
}
if (localLinkData.graphSourceSha256 !== graph.sourceSha256) {
  throw new Error('Local routing links were generated from another graph version');
}
(localLinkData.links as unknown as LocalLink[]).forEach((link) => {
  addArc({
    id: `${link.floor}:LOS:${link.source}:${link.target}`,
    from: `${link.floor}:${link.source}`, to: `${link.floor}:${link.target}`,
    kind: 'local', floor: link.floor, points: link.points,
    meters: link.distanceM, seconds: link.distanceM / speedMetersPerSecond,
    verificationStatus: 'ESTIMATED',
  });
});

interface RoutingState {
  key: string;
  node: string;
  incoming: Arc | null;
  previous: RoutingState | null;
  cost: number;
  meters: number;
  seconds: number;
  turns: number;
  decisionPoints: number;
  transfers: number;
}

function arcTurns(previous: Arc | null, next: Arc): number {
  if (next.kind === 'transfer') return 0;
  const internal = countMeaningfulTurns(next.points);
  if (!previous || previous.kind === 'transfer'
    || previous.floor !== next.floor || previous.points.length < 2) return internal;
  const prior = previous.points;
  const angle = turnAngleDegrees(prior[prior.length - 2], prior[prior.length - 1], next.points[1]);
  return internal + Number(Math.abs(angle) >= 35);
}

const TREE_CACHE_LIMIT = 8;
const routeTrees = new Map<string, Map<string, RoutingState>>();

function sourceTree(startId: string, mode: TravelMode,
  strategy: RouteStrategy): Map<string, RoutingState> {
  const cacheKey = `${graph.sourceSha256}:${startId}:${mode}:${strategy}`;
  const cached = routeTrees.get(cacheKey);
  if (cached) return cached;
  const first: RoutingState = {
    key: `start:${startId}`, node: startId, incoming: null, previous: null,
    cost: 0, meters: 0, seconds: 0, turns: 0, decisionPoints: 0, transfers: 0,
  };
  const heap = new MinHeap();
  const best = new Map<string, RoutingState>([[first.key, first]]);
  const targetStates = new Map<string, RoutingState>();
  heap.push(first);
  while (heap.size) {
    const current = heap.pop()!;
    if (best.get(current.key) !== current) continue;
    if (!targetStates.has(current.node)) targetStates.set(current.node, current);
    const outgoing = (adjacency.get(current.node) ?? []).filter((arc) =>
      mode !== 'ACCESSIBLE' || arc.kind !== 'transfer' || arc.connector?.kind === 'elevator');
    outgoing.forEach((arc) => {
      const turns = arcTurns(current.incoming, arc);
      const decision = turns > 0 && outgoing.length > 2 ? 1 : 0;
      const transfer = Number(arc.kind === 'transfer');
      const meters = current.meters + arc.meters;
      const cost = current.cost + arc.meters + (strategy === 'SIMPLE'
        ? turns * TURN_COST_METERS + decision * DECISION_COST_METERS
          + transfer * TRANSFER_COST_METERS : 0);
      const candidate: RoutingState = {
        key: `${arc.id}:${arc.from}:${arc.to}`, node: arc.to,
        incoming: arc, previous: current, cost, meters,
        seconds: current.seconds + arc.seconds,
        turns: current.turns + turns,
        decisionPoints: current.decisionPoints + decision,
        transfers: current.transfers + transfer,
      };
      const previous = best.get(candidate.key);
      if (!previous || compare(candidate, previous) < -1e-7) {
        best.set(candidate.key, candidate);
        heap.push(candidate);
      }
    });
  }
  if (routeTrees.size >= TREE_CACHE_LIMIT) routeTrees.delete(routeTrees.keys().next().value!);
  routeTrees.set(cacheKey, targetStates);
  return targetStates;
}

function search(startId: string, destinationId: string, mode: TravelMode,
  strategy: RouteStrategy): Arc[] | null {
  if (!nodes.has(startId) || !nodes.has(destinationId)) return null;
  const target = sourceTree(startId, mode, strategy).get(destinationId);
  if (!target) return null;
  const result: Arc[] = [];
  let state: RoutingState | null = target;
  while (state?.incoming) {
    result.unshift(state.incoming);
    state = state.previous;
  }
  return result;
}

function toSegments(arcs: Arc[], startId: string): RouteSegment[] {
  const segments: RouteSegment[] = [];
  let floorArcs: Arc[] = [];
  const flush = () => {
    if (!floorArcs.length) return;
    const floor = floorArcs[0].floor;
    const originalPoints = floorArcs.flatMap((arc, index) =>
      arc.points.slice(index === 0 ? 0 : 1));
    const optimized = optimizeFloorGeometry(floor, originalPoints);
    const scale = metersPerUnit(floor);
    const distanceMeters = scale === null ? NaN : optimized.finalLengthUnits * scale;
    segments.push({
      kind: 'floor', floor, points: optimized.points,
      originalPoints, edgeIds: floorArcs.map((arc) => arc.id),
      distanceMeters, estimatedSeconds: distanceMeters / speedMetersPerSecond,
      verificationStatus: optimized.status === 'PASS' ? 'ESTIMATED' : 'UNVERIFIED',
    });
    floorArcs = [];
  };
  arcs.forEach((arc) => {
    if (arc.kind !== 'transfer') {
      floorArcs.push(arc);
      return;
    }
    flush();
    const wait = arc.connector?.kind === 'elevator'
      ? graph.method.verticalFacilityModel.elevatorWaitAndDoorSecondsAssumed : 0;
    segments.push({
      kind: 'transfer', id: arc.id, fromFloor: arc.floor,
      toFloor: nodes.get(arc.to)!.floor, connectorType: arc.connector!.kind,
      distanceMeters: arc.meters, estimatedSeconds: arc.seconds,
      estimatedWaitingSeconds: wait, verificationStatus: 'ESTIMATED',
    });
  });
  flush();
  if (!segments.length) {
    const node = nodes.get(startId)!;
    segments.push({
      kind: 'floor', floor: node.floor, points: [node.point], originalPoints: [node.point],
      edgeIds: [], distanceMeters: 0, estimatedSeconds: 0,
      verificationStatus: 'ESTIMATED',
    });
  }
  return segments;
}

function assemble(startId: string, destinationId: string, arcs: Arc[], mode: TravelMode,
  strategy: RouteStrategy): NavigationRoute {
  const floorSegments = toSegments(arcs, startId);
  const errors: string[] = [];
  const warnings: string[] = [];
  floorSegments.forEach((segment) => {
    if (segment.kind === 'floor' && polylineWalkability(segment.floor, segment.points) === 'FAIL') {
      errors.push(`${segment.floor}: 경로가 보행 불가 도형을 통과합니다.`);
    }
    if (segment.verificationStatus === 'UNVERIFIED') {
      warnings.push(`${segment.kind === 'floor' ? segment.floor : segment.id}: 통행 가능성 확인 필요`);
    }
  });
  const distanceMeters = floorSegments.reduce((sum, segment) => sum + segment.distanceMeters, 0);
  const walkingSeconds = floorSegments.filter((segment) => segment.kind === 'floor')
    .reduce((sum, segment) => sum + segment.estimatedSeconds, 0);
  const transferSegments = floorSegments.filter((segment): segment is TransferRouteSegment =>
    segment.kind === 'transfer');
  const estimatedWaitingSeconds = transferSegments.reduce((sum, segment) =>
    sum + segment.estimatedWaitingSeconds, 0);
  const verticalMovementSeconds = transferSegments.reduce((sum, segment) =>
    sum + segment.estimatedSeconds - segment.estimatedWaitingSeconds, 0);
  const turnCount = floorSegments.filter((segment): segment is FloorRouteSegment =>
    segment.kind === 'floor').reduce((sum, segment) =>
    sum + countMeaningfulTurns(segment.points), 0);
  const originalNodeIds = [startId, ...arcs.map((arc) => arc.to)];
  const instructions = buildNavigationInstructions(floorSegments, speedMetersPerSecond);
  return {
    id: `${graph.sourceSha256.slice(0, 8)}:${mode}:${strategy}:${startId}:${destinationId}`,
    startId, destinationId, mode, strategy,
    originalNodeIds, originalEdgeIds: arcs.map((arc) => arc.id), floorSegments,
    instructions,
    metrics: {
      distanceMeters, estimatedSeconds: walkingSeconds + verticalMovementSeconds
        + estimatedWaitingSeconds,
      walkingSeconds, verticalMovementSeconds, estimatedWaitingSeconds,
      turnCount, instructionCount: instructions.length, floorTransferCount: transferSegments.length,
    },
    verificationStatus: warnings.length ? 'UNVERIFIED' : 'ESTIMATED',
    validation: { isValid: errors.length === 0, warnings, errors },
  };
}

/** Shared graph and spatial route for every floor and both travel modes. */
export function findNavigationRoute(startId: string, destinationId: string,
  { mode = 'NORMAL', strategy = 'SIMPLE' }: RoutingOptions = {}): NavigationRoute | null {
  const shortestArcs = search(startId, destinationId, mode, 'SHORTEST');
  if (!shortestArcs) return null;
  const shortest = assemble(startId, destinationId, shortestArcs, mode, 'SHORTEST');
  if (!shortest.validation.isValid || strategy === 'SHORTEST') return shortest;
  const simpleArcs = search(startId, destinationId, mode, 'SIMPLE');
  if (!simpleArcs) return shortest;
  const simple = assemble(startId, destinationId, simpleArcs, mode, 'SIMPLE');
  const withinLimit = simple.metrics.distanceMeters <= shortest.metrics.distanceMeters
    * (1 + SIMPLE_MAX_EXTRA_DISTANCE_RATIO) + 0.01;
  const simpler = simple.metrics.turnCount < shortest.metrics.turnCount
    || (simple.metrics.turnCount === shortest.metrics.turnCount
      && simple.originalNodeIds.length < shortest.originalNodeIds.length);
  return simple.validation.isValid && withinLimit && simpler ? simple : shortest;
}

export function navigationNode(id: string): { floor: string; point: MapPoint } | null {
  return nodes.get(id) ?? null;
}

export function graphSummary(): { nodes: number; edges: number; localEdges: number } {
  return {
    nodes: nodes.size,
    edges: Object.values(graph.floors).reduce((sum, floor) => sum
      + floor.edges.filter((edge) => edge.routingEnabled).length, 0),
    localEdges: [...adjacency.values()].flat().filter((arc) => arc.kind === 'local').length / 2,
  };
}
