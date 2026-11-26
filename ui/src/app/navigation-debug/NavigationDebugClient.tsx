'use client';

import { useMemo, useState } from 'react';

import previousGraph from '@/data/daejeon_routes_calculated.json';
import generatedGraph from '@/data/navigation/graph.generated.json';
import facilities from '@/data/navigation/facilities.generated.json';

import { compareGraphAndGrid } from '@/lib/station/gridAudit';
import { validateNavigationGraph } from '@/lib/station/graphValidation';
import { findNavigationRoute, type FloorRouteSegment } from '@/lib/station/navigation';
import { floorSpatialData } from '@/lib/station/spatial';
import type { MapPoint } from '@/lib/station/types';

type Floor = '1F' | '2F' | '3F' | '4F';
type Layer = 'previousEdges' | 'edges' | 'nodes' | 'areas' | 'facilities'
  | 'shortest' | 'simple' | 'grid' | 'warnings';

const FLOOR_IDS: Floor[] = ['1F', '2F', '3F', '4F'];
const LAYER_LABELS: Record<Layer, string> = {
  previousEdges: '기존 Edge', edges: '보정 Edge', nodes: 'Node', areas: '공간·장애물',
  facilities: '시설 표시 위치', shortest: '최단 경로', simple: '간단 경로',
  grid: '독립 Grid A*', warnings: '검증 경고',
};
const DEFAULT_LAYERS: Record<Layer, boolean> = {
  previousEdges: false, edges: true, nodes: false, areas: false,
  facilities: false, shortest: true, simple: true, grid: false, warnings: true,
};

function path(points: readonly MapPoint[]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

function floorSegments(route: ReturnType<typeof findNavigationRoute>, floor: Floor) {
  return route?.floorSegments.filter((segment): segment is FloorRouteSegment =>
    segment.kind === 'floor' && segment.floor === floor) ?? [];
}

function metric(value: number | null | undefined, suffix = ''): string {
  return value === null || value === undefined ? '확인 불가' : `${value.toFixed(1)}${suffix}`;
}

function areaColor(type: string): string {
  if (type === 'FACILITY') return '#ff6b6b55';
  if (type === 'WALKABLE_AREA') return '#3fc0aa22';
  return '#aa66ff55';
}

export default function NavigationDebugClient() {
  const [floor, setFloor] = useState<Floor>('3F');
  const [start, setStart] = useState('3F:C01');
  const [destination, setDestination] = useState('3F:P26');
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const validation = useMemo(() => validateNavigationGraph(), []);
  const shortest = useMemo(() => findNavigationRoute(start, destination,
    { strategy: 'SHORTEST' }), [start, destination]);
  const simple = useMemo(() => findNavigationRoute(start, destination,
    { strategy: 'SIMPLE' }), [start, destination]);
  const grid = useMemo(() => start.split(':')[0] === destination.split(':')[0]
    ? compareGraphAndGrid(start, destination) : null, [start, destination]);
  const spatial = floorSpatialData(floor);
  const viewBox = spatial?.viewBox ?? [0, 0, 1000, 1000];
  const [vbX, vbY, width, height] = viewBox;
  const graphFloor = generatedGraph.floors[floor];
  const oldFloor = previousGraph.floors[floor];
  const issues = validation.issues.filter((issue) => issue.reference.startsWith(`${floor}:`));
  const nodes = FLOOR_IDS.flatMap((id) => generatedGraph.floors[id].nodes.map((node) => ({
    id: `${id}:${node.id}`, label: `${id} ${node.id}`,
  })));

  const chooseRoute = (target: string) => {
    setStart('3F:C01');
    setDestination(target);
    setFloor('3F');
  };
  const exportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(), start, destination,
      graphValidation: validation, shortest, simple, grid,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'daejeon-navigation-validation.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', color: '#22314A' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>대전역 경로 검증 · 개발 전용</h1>
      <p>SVG 도면 기반 추정 결과입니다. 현장 통행 가능성과 시설 출입구는 별도 확인이 필요합니다.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBlock: 16 }}>
        <label htmlFor="debug-start">출발 노드
          <select id="debug-start" value={start} onChange={(event) => setStart(event.target.value)}>
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
          </select>
        </label>
        <label htmlFor="debug-destination">목적지 노드
          <select id="debug-destination" value={destination}
            onChange={(event) => setDestination(event.target.value)}>
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={exportJson}>검증 결과 JSON 내보내기</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {FLOOR_IDS.map((id) => <button key={id} type="button" onClick={() => setFloor(id)}
          aria-pressed={floor === id}>{id}</button>)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {(Object.keys(LAYER_LABELS) as Layer[]).map((layer) => (
          <label key={layer} htmlFor={`layer-${layer}`}>
            <input id={`layer-${layer}`} type="checkbox" checked={layers[layer]}
              onChange={(event) => setLayers({ ...layers, [layer]: event.target.checked })} />
            {LAYER_LABELS[layer]}
          </label>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(270px, 1fr)',
        gap: 20, alignItems: 'start' }}>
        <svg viewBox={`${vbX} ${vbY} ${width} ${height}`} role="img"
          aria-label={`${floor} 평면도와 경로 비교`}
          style={{ width: '100%', border: '1px solid #C0C5CD', background: '#fff' }}>
          <image href={`/maps/web-${floor}-map.svg`} x={vbX} y={vbY} width={width} height={height} />
          {layers.areas && spatial?.areas.map((area) => <polygon key={area.id}
            points={area.polygon.map(([x, y]) => `${x},${y}`).join(' ')}
            fill={areaColor(area.type)}
            stroke="#555" strokeWidth="1" />)}
          {layers.previousEdges && oldFloor.edges.filter((edge) => edge.geometrySvg.length > 1)
            .map((edge) => <path key={edge.id} d={path(edge.geometrySvg as MapPoint[])}
              fill="none" stroke="#999" strokeWidth="2" />)}
          {layers.edges && graphFloor.edges.filter((edge) => edge.geometrySvg.length > 1)
            .map((edge) => <path key={edge.id} d={path(edge.geometrySvg as MapPoint[])}
              fill="none" stroke={selectedEdge === edge.id ? '#f00' : '#2778c4'}
              strokeWidth={selectedEdge === edge.id ? 7 : 2}
              onClick={() => setSelectedEdge(edge.id)} />)}
          {layers.nodes && graphFloor.nodes.map((node) => <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="5" fill="#162b4d" />
            <text x={node.x + 7} y={node.y - 7} fontSize="12">{node.id}</text>
          </g>)}
          {layers.facilities && facilities.facilities.filter((item) => item.floor === floor
            && item.displayPosition).map((item) => <circle key={item.id}
              cx={item.displayPosition[0]} cy={item.displayPosition[1]} r="7" fill="#c45a00" />)}
          {layers.shortest && floorSegments(shortest, floor).map((segment) => <path
            key={`short-${segment.edgeIds.join('-')}`} d={path(segment.points)} fill="none"
            stroke="#0d975f" strokeWidth="8" strokeDasharray="12 8" />)}
          {layers.simple && floorSegments(simple, floor).map((segment) => <path
            key={`simple-${segment.edgeIds.join('-')}`} d={path(segment.points)} fill="none"
            stroke="#e63946" strokeWidth="5" />)}
          {layers.grid && grid && start.startsWith(`${floor}:`) && grid.gridPoints.length > 1
            && <path d={path(grid.gridPoints)} fill="none" stroke="#7d48c6" strokeWidth="3" />}
          {layers.warnings && issues.filter((issue) => issue.code === 'UNKNOWN_SPACE')
            .flatMap((issue) => graphFloor.edges.filter((edge) => issue.reference === `${floor}:${edge.id}`))
            .map((edge) => <path key={`warning-${edge.id}`} d={path(edge.geometrySvg as MapPoint[])}
              fill="none" stroke="#ff9800" strokeWidth="6" />)}
        </svg>
        <aside>
          <h2>경로 비교</h2>
          <table><thead><tr><th>지표</th><th>최단</th><th>간단</th></tr></thead>
            <tbody>
              <tr><td>거리</td><td>{metric(shortest?.metrics.distanceMeters, 'm')}</td>
                <td>{metric(simple?.metrics.distanceMeters, 'm')}</td></tr>
              <tr><td>예상 시간</td><td>{metric(shortest?.metrics.estimatedSeconds, '초')}</td>
                <td>{metric(simple?.metrics.estimatedSeconds, '초')}</td></tr>
              <tr><td>회전</td><td>{shortest?.metrics.turnCount ?? '—'}</td>
                <td>{simple?.metrics.turnCount ?? '—'}</td></tr>
              <tr><td>노드</td><td>{shortest?.originalNodeIds.length ?? '—'}</td>
                <td>{simple?.originalNodeIds.length ?? '—'}</td></tr>
              <tr><td>안내 단계</td><td>{shortest?.metrics.instructionCount ?? '—'}</td>
                <td>{simple?.metrics.instructionCount ?? '—'}</td></tr>
              <tr><td>검증</td><td>{shortest?.verificationStatus ?? '불가'}</td>
                <td>{simple?.verificationStatus ?? '불가'}</td></tr>
            </tbody>
          </table>
          <p>Grid A*: {grid?.status ?? '층간 비교 불가'} · 거리 {metric(grid?.gridDistanceMeters, 'm')}</p>
          <h2>문제 경로</h2>
          <button type="button" onClick={() => chooseRoute('3F:P26')}>맞이방 → 마루노바</button>
          <button type="button" onClick={() => chooseRoute('3F:P50')}>맞이방 → 계단·에스컬레이터</button>
          <h2>검증 이슈 ({issues.length})</h2>
          <ul style={{ maxHeight: 260, overflow: 'auto' }}>
            {issues.map((issue) => <li key={`${issue.reference}-${issue.code}-${issue.message}`}>
              <button type="button" onClick={() => setSelectedEdge(issue.reference.split(':')[1])}>
                {issue.reference} · {issue.code}
              </button>
            </li>)}
          </ul>
        </aside>
      </div>
    </main>
  );
}
