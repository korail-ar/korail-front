import { fitAffine, project, localMeters, shortestPath } from './station-route-math.js';

export const MAX_AGE_MS = 15000;
export function calibration(config) {
  const anchors = config.anchors.filter(a => a.role === 'training' && a.verified === true);
  const fit = fitAffine(anchors);
  const checks = config.anchors.filter(a => a.role === 'validation' && a.verified === true);
  const errors = fit ? checks.map(a => {
    const [x, y] = project(fit, a.lat, a.lng);
    return Math.hypot(x - a.x, y - a.y);
  }) : [];
  return { fit, anchors, errors, status: fit && errors.length ? 'validation-pending-field-review' : 'GPS 정합 미완료' };
}
export function candidatePreview(points, floor) {
  // ponytail: 기존 추정 GPS에서 되돌린 시각화일 뿐 정확도 검증이 아니다. 현장 기준점으로 교체한다.
  const anchors = points.filter(p => p.floor === floor && p.mapId === `daejeon-station-${floor}F-map.svg` && p.candidateGps?.usableForProduction === false && Number.isFinite(p.candidateGps.lat) && Number.isFinite(p.candidateGps.lng))
    .map(p => ({ lat: p.candidateGps.lat, lng: p.candidateGps.lng, x: p.x, y: p.y }));
  return fitAffine(anchors);
}
export function validPosition(position, now = Date.now()) {
  const { latitude, longitude, accuracy } = position.coords;
  if (![latitude, longitude, accuracy, position.timestamp].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0) return '잘못된 위치 값';
  if (now - position.timestamp > MAX_AGE_MS || position.timestamp > now + 5000) return '오래된 위치';
  return null;
}
export function smoothPosition(previous, next) {
  if (!previous) return next;
  const distance = Math.hypot(...localMeters(next.coords.latitude, next.coords.longitude, { lat: previous.coords.latitude, lng: previous.coords.longitude }));
  const elapsed = Math.max(0, (next.timestamp - previous.timestamp) / 1000);
  if (distance > Math.max(20, previous.coords.accuracy + next.coords.accuracy + elapsed * 3)) return previous;
  const factor = Math.min(1, Math.max(0.25, distance / Math.max(1, next.coords.accuracy)));
  return { ...next, coords: { ...next.coords, latitude: previous.coords.latitude + factor * (next.coords.latitude - previous.coords.latitude), longitude: previous.coords.longitude + factor * (next.coords.longitude - previous.coords.longitude) } };
}
export function edgeCandidates(graph, point, accuracyPx = Infinity, includeUnverified = false) {
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  return graph.edges.flatMap(edge => {
    const a = nodes.get(edge.source), b = nodes.get(edge.target);
    if (!a || !b || edge.enabled === false || (!includeUnverified && edge.verified !== true)) return [];
    const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
    if (!length2) return [];
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2));
    const x = a.x + t * dx, y = a.y + t * dy, distance = Math.hypot(point.x - x, point.y - y);
    return distance <= accuracyPx ? [{ edge, x, y, t, distance }] : [];
  }).sort((a, b) => a.distance - b.distance);
}
export function matchEdge(graph, point, accuracyPx, previous = null, includeUnverified = false) {
  const candidates = edgeCandidates(graph, point, accuracyPx, includeUnverified).map(candidate => {
    const connected = previous && [candidate.edge.source, candidate.edge.target].some(id => id === previous.edge.source || id === previous.edge.target);
    return { ...candidate, score: candidate.distance - (previous?.edge.id === candidate.edge.id ? Math.min(accuracyPx / 3, 8) : connected ? Math.min(accuracyPx / 6, 4) : 0) };
  });
  candidates.sort((a, b) => a.score - b.score);
  if (!candidates.length || (candidates[1] && candidates[1].score - candidates[0].score < Math.max(3, accuracyPx / 4))) return null;
  return candidates[0];
}
export function routeFromEdge(graph, match, destination) {
  if (!match) return null;
  const id = '__gps_start__', edge = match.edge;
  const weight = Number(edge.weight);
  if (!Number.isFinite(weight) || weight < 0) return null;
  const augmented = { ...graph, nodes: [...graph.nodes, { id, x: match.x, y: match.y }], edges: [...graph.edges, { source: id, target: edge.target, weight: weight * (1 - match.t), bidirectional: false }, ...(edge.bidirectional ? [{ source: id, target: edge.source, weight: weight * match.t, bidirectional: false }] : [])] };
  return shortestPath(augmented, id, destination);
}
export function distanceToPolyline(points, point) {
  if (points.length === 1) return Math.hypot(point.x - points[0].x, point.y - points[0].y);
  let nearest = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y;
    const t = dx || dy ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy))) : 0;
    nearest = Math.min(nearest, Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy));
  }
  return nearest;
}
