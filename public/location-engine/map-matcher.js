import { edgeCandidates } from '../gps-location.js';

const angleDifference = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
export function matchPosition(graph, point, { previous = null, heading = null, uncertaintyPx = 15, routeEdgeIds = [] } = {}) {
  if (!point) return { match: null, candidates: [], reason: '지도 거리 보정 필요' };
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const nearby = edgeCandidates(graph, point, Math.max(12, uncertaintyPx * 2), true);
  const routeSet = new Set(routeEdgeIds);
  const candidates = nearby.map(candidate => {
    const { edge } = candidate, a = nodes.get(edge.source), b = nodes.get(edge.target);
    const bearing = (Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI + 360) % 360;
    const direction = heading === null ? 0 : Math.min(angleDifference(heading, bearing), edge.bidirectional ? angleDifference(heading, (bearing + 180) % 360) : 180);
    const connected = previous && [edge.source, edge.target].some(id => id === previous.edge.source || id === previous.edge.target);
    const jump = previous ? Math.hypot(candidate.x - previous.x, candidate.y - previous.y) : 0;
    const score = candidate.distance + direction / 90 * Math.min(uncertaintyPx, 8) + (previous && !connected && edge.id !== previous.edge.id ? Math.min(uncertaintyPx, 15) : 0) + Math.max(0, jump - uncertaintyPx * 2) + (routeSet.has(edge.id) ? -0.4 : 0);
    return { ...candidate, score, direction, connected, jump };
  }).sort((a, b) => a.score - b.score);
  const best = candidates[0], second = candidates[1];
  if (!best) return { match: null, candidates, reason: '가까운 통로 없음' };
  if (second && second.score - best.score < Math.max(2, uncertaintyPx * 0.3)) return { match: null, candidates, reason: '통로 후보가 겹침' };
  if (previous && best.jump > Math.max(20, uncertaintyPx * 2)) return { match: null, candidates, reason: '통로 이동량 불확실' };
  return { match: best, candidates, reason: '추정 통로' };
}
