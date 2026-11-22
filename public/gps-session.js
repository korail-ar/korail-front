import { fastestRoute } from './assets/json/fastest-route.mjs';

export const START_ID = '__gps_start__';
export function withEdgeStart(graph, match) {
  const { edge, t, x, y } = match;
  const weight = Number(edge.weight);
  if (!Number.isFinite(weight) || weight < 0) throw Error('잘못된 통로 비용');
  return { ...graph, nodes: [...graph.nodes, { id: START_ID, x, y }], edges: [
    ...graph.edges,
    { id: `${START_ID}:forward`, source: START_ID, target: edge.target, weight: weight * (1 - t), selectedDistanceM: edge.selectedDistanceM * (1 - t), bidirectional: false, verified: edge.verified },
    ...(edge.bidirectional ? [{ id: `${START_ID}:back`, source: START_ID, target: edge.source, weight: weight * t, selectedDistanceM: edge.selectedDistanceM * t, bidirectional: false, verified: edge.verified }] : [])
  ] };
}
export function nearestReachablePlace(graph, match, excludedId = null) {
  const augmented = withEdgeStart(graph, match);
  let best = null;
  for (const place of graph.places) {
    if (place.id === excludedId || !place.nodeId || place.entranceVerified === false) continue;
    const route = fastestRoute(augmented, START_ID, place.nodeId);
    if (route.reachable && (!best || route.estimatedTimeSeconds < best.route.estimatedTimeSeconds)) best = { place, route };
  }
  return best;
}
export function routeToPlace(graph, match, place) {
  if (!place?.nodeId) return null;
  const augmented = withEdgeStart(graph, match);
  const route = fastestRoute(augmented, START_ID, place.nodeId);
  return route.reachable ? { route, points: route.nodeIds.map(id => augmented.nodes.find(n => n.id === id)) } : null;
}
export function sessionSummary(rows, counters) {
  const samples = rows.filter(r => r.eventType === 'sample' || !r.eventType);
  const good = samples.filter(r => Number.isFinite(r.accuracy));
  return {
    samples: samples.length,
    meanAccuracy: good.length ? good.reduce((n, r) => n + r.accuracy, 0) / good.length : null,
    estimatedDistance: counters.distance || 0,
    offRoute: counters.offRoute || 0,
    reroutes: counters.reroutes || 0,
    uncertain: counters.uncertain || 0
  };
}
export function sessionCsv(rows) {
  const keys = ['eventType', 'timestamp', 'phase', 'latitude', 'longitude', 'accuracy', 'heading', 'speed', 'floor', 'mapId', 'rawX', 'rawY', 'x', 'y', 'correctionDx', 'correctionDy', 'positionBasis', 'boundaryLimited', 'matchedX', 'matchedY', 'edgeId', 'nearestEdgeId', 'nearestEdgeDistanceSvg', 'nearbyEdgeCount', 'matchReason', 'routeActive', 'destinationId', 'routeEdgeIds', 'routeDistanceSvg', 'offRouteStreak', 'state', 'source'];
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [keys.join(','), ...rows.map(row => keys.map(key => cell(row[key])).join(','))].join('\r\n');
}
