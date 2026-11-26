import graphData from '@/data/navigation/graph.generated.json';

import { allFacilities } from './facilities';
import { floorSpatialData, polylineLength, polylineWalkability } from './spatial';
import type { MapPoint } from './types';

export interface GraphIssue {
  severity: 'ERROR' | 'WARNING';
  code: string;
  reference: string;
  message: string;
}

export interface GraphValidationReport {
  schemaVersion: 1;
  nodeCount: number;
  edgeCount: number;
  enabledEdgeCount: number;
  connectorCount: number;
  componentSizes: number[];
  issues: GraphIssue[];
}

interface Node { id: string; x: number; y: number }
interface Edge {
  id: string; source: string; target: string; geometrySvg: MapPoint[];
  routingEnabled: boolean; distanceM: number;
}
interface Floor { nodes: Node[]; edges: Edge[] }
interface Link {
  id: string; direction: string; routingEnabled: boolean;
  from: { sourceFloor: string; sourceGraphNodeId: string };
  to: { targetFloor: string; targetGraphNodeId: string };
}
const data = graphData as unknown as {
  floors: Record<string, Floor>; verticalLinks: Link[];
};

function distance(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function pointOnSegment(point: MapPoint, a: MapPoint, b: MapPoint): boolean {
  const length = distance(a, b);
  return length > 0.5 && Math.abs(distance(a, point) + distance(point, b) - length) < 0.05
    && distance(a, point) > 0.5 && distance(point, b) > 0.5;
}

export function validateNavigationGraph(): GraphValidationReport {
  const issues: GraphIssue[] = [];
  const add = (severity: GraphIssue['severity'], code: string,
    reference: string, message: string) => issues.push({ severity, code, reference, message });
  const globalAdjacency = new Map<string, Set<string>>();
  let nodeCount = 0;
  let edgeCount = 0;
  let enabledEdgeCount = 0;

  Object.entries(data.floors).forEach(([floor, entry]) => {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    nodeCount += entry.nodes.length;
    edgeCount += entry.edges.length;
    entry.nodes.forEach((node) => {
      if (nodeIds.has(node.id)) add('ERROR', 'DUPLICATE_NODE_ID', `${floor}:${node.id}`, '중복 노드 ID');
      nodeIds.add(node.id);
      globalAdjacency.set(`${floor}:${node.id}`, new Set());
    });
    const nodes = new Map(entry.nodes.map((node) => [node.id, node]));
    const scale = floorSpatialData(floor)?.metersPerUnit;
    if (!scale || scale <= 0) add('ERROR', 'MISSING_SCALE', floor, '층별 축척 없음');
    entry.edges.forEach((edge) => {
      const reference = `${floor}:${edge.id}`;
      if (edgeIds.has(edge.id)) add('ERROR', 'DUPLICATE_EDGE_ID', reference, '중복 간선 ID');
      edgeIds.add(edge.id);
      const from = nodes.get(edge.source);
      const to = nodes.get(edge.target);
      if (!from || !to) {
        add('ERROR', 'MISSING_ENDPOINT', reference, '존재하지 않는 노드 참조');
        return;
      }
      if (edge.source === edge.target) add('ERROR', 'SELF_EDGE', reference, '자기 연결 간선');
      if (!edge.geometrySvg?.length || polylineLength(edge.geometrySvg) < 0.01) {
        add(edge.routingEnabled ? 'ERROR' : 'WARNING', 'ZERO_EDGE', reference,
          '형상이 없거나 길이가 0; 비활성 간선은 탐색에서 제외됨');
        return;
      }
      if (distance(edge.geometrySvg[0], [from.x, from.y]) > 0.1
        || distance(edge.geometrySvg[edge.geometrySvg.length - 1], [to.x, to.y]) > 0.1) {
        add('ERROR', 'ENDPOINT_MISMATCH', reference, '형상 끝과 노드 좌표 불일치');
      }
      if (scale && Math.abs(polylineLength(edge.geometrySvg) * scale - edge.distanceM) > 0.15) {
        add('ERROR', 'DISTANCE_MISMATCH', reference, '저장 거리와 형상 길이 불일치');
      }
      if (edge.distanceM > 200) add('WARNING', 'LONG_EDGE', reference, '200m 초과 간선 검토');
      if (!edge.routingEnabled) return;
      enabledEdgeCount += 1;
      globalAdjacency.get(`${floor}:${edge.source}`)?.add(`${floor}:${edge.target}`);
      globalAdjacency.get(`${floor}:${edge.target}`)?.add(`${floor}:${edge.source}`);
      const walkability = polylineWalkability(floor, edge.geometrySvg);
      if (walkability === 'FAIL') add('ERROR', 'BLOCKED_EDGE', reference, '보행 불가 도형 침범');
      if (walkability === 'UNVERIFIED') {
        add('WARNING', 'UNKNOWN_SPACE', reference, '건물 바닥 윤곽 밖 또는 미검증 구간');
      }
      entry.nodes.forEach((node) => {
        if (node.id === edge.source || node.id === edge.target) return;
        const point: MapPoint = [node.x, node.y];
        if (edge.geometrySvg.slice(1).some((next, index) =>
          pointOnSegment(point, edge.geometrySvg[index], next))) {
          add('WARNING', 'NODING_CANDIDATE', reference,
            `${node.id} 노드가 간선 내부에 있음. 실제 교차 가능 여부 확인 필요`);
        }
      });
    });
  });

  data.verticalLinks.forEach((link) => {
    const from = `${link.from.sourceFloor}:${link.from.sourceGraphNodeId}`;
    const to = `${link.to.targetFloor}:${link.to.targetGraphNodeId}`;
    if (!globalAdjacency.has(from) || !globalAdjacency.has(to)) {
      add('ERROR', 'INVALID_CONNECTOR', link.id, '층간 링크의 노드 없음');
    }
    if (!link.routingEnabled) return;
    if (link.direction === 'unknown') {
      add('ERROR', 'UNKNOWN_DIRECTION_ENABLED', link.id, '방향 미확인 연결 활성화');
      return;
    }
    globalAdjacency.get(from)?.add(to);
    globalAdjacency.get(to)?.add(from);
  });

  allFacilities().forEach((facility) => facility.entrances.forEach((entrance) => {
    if (!globalAdjacency.has(`${facility.floor}:${entrance.connectedNodeId}`)) {
      add('ERROR', 'FACILITY_ACCESS_MISSING', `${facility.id}:${entrance.id}`,
        '시설 접근 노드 없음');
    }
  }));

  const unseen = new Set(globalAdjacency.keys());
  const componentSizes: number[] = [];
  while (unseen.size) {
    const stack = [unseen.values().next().value as string];
    let count = 0;
    while (stack.length) {
      const current = stack.pop()!;
      if (unseen.delete(current)) {
        count += 1;
        globalAdjacency.get(current)?.forEach((neighbor) => {
          if (unseen.has(neighbor)) stack.push(neighbor);
        });
      }
    }
    componentSizes.push(count);
  }
  componentSizes.sort((a, b) => b - a);
  return {
    schemaVersion: 1, nodeCount, edgeCount, enabledEdgeCount,
    connectorCount: data.verticalLinks.length, componentSizes, issues,
  };
}
