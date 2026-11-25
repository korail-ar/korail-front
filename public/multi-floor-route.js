import { fastestRoute } from './assets/json/fastest-route.mjs';

const connectorIds = {
  stairs: { 1: '1F-P08', 2: '2F-P07', 3: '3F-P14' },
  accessible: { 1: '1F-P06', 2: '2F-P04', 3: '3F-P16' }
};

export function buildStationRoute(graphs, from, to, accessible = false) {
  const startFloor = Number(from.floor), endFloor = Number(to.floor);
  const direction = Math.sign(endFloor - startFloor);
  const floors = direction ? Array.from({ length: Math.abs(endFloor - startFloor) + 1 }, (_, i) => startFloor + i * direction) : [startFloor];
  const connector = connectorIds[accessible ? 'accessible' : 'stairs'];
  if (direction && floors.some(floor => !connector[floor])) return null;
  const segments = [];
  for (const [index, floor] of floors.entries()) {
    const graph = graphs.get(floor);
    if (!graph) return null;
    const startId = index === 0 ? from.id : connector[floor];
    const endId = index === floors.length - 1 ? to.id : connector[floor];
    const start = graph.places.find(place => place.id === startId);
    const end = graph.places.find(place => place.id === endId);
    const nodeId = place => place?.nodeId || place?.candidateApproachNodeId;
    if (!nodeId(start) || !nodeId(end)) return null;
    const route = fastestRoute(graph, nodeId(start), nodeId(end));
    if (!route.reachable) return null;
    segments.push({ floor, graph, start, end, route });
  }
  const verticalSeconds = direction ? (floors.length - 1) * (accessible ? 70 : 45) : 0;
  return {
    segments,
    accessible,
    connectorName: accessible ? '서광장 A 승강기' : '중앙 계단',
    estimatedTimeSeconds: segments.reduce((sum, segment) => sum + segment.route.estimatedTimeSeconds, verticalSeconds),
    estimatedDistanceM: segments.reduce((sum, segment) => sum + segment.route.estimatedDistanceM, 0),
    provisionalVerticalConnection: Boolean(direction)
  };
}
