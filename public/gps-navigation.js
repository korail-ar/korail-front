export function constrainToFloor(point, [left, top, width, height]) {
  const x = Math.max(left, Math.min(left + width, point.x));
  const y = Math.max(top, Math.min(top + height, point.y));
  return { x, y, limited: x !== point.x || y !== point.y };
}

export function routeProjection(points, point) {
  let best = { distance: Infinity, progress: 0, x: NaN, y: NaN };
  let traveled = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y;
    const length2 = dx * dx + dy * dy;
    if (!length2) continue;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2));
    const x = a.x + t * dx, y = a.y + t * dy;
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < best.distance) best = { distance, progress: traveled + t * Math.sqrt(length2), x, y };
    traveled += Math.sqrt(length2);
  }
  return { ...best, total: traveled };
}

export function navigationDecision(previous, current, uncertaintyPx, streak, canReroute) {
  // ponytail: 30 SVG 단위는 미측량 통로 폭의 임시 하한이다. 현장 측량 후 실제 폭으로 교체한다.
  const offRoute = canReroute && current.distance > Math.max(30, uncertaintyPx * 2) ? streak + 1 : 0;
  let direction = '방향 판단 보류';
  if (previous && current.timestamp > previous.timestamp) {
    const movement = Math.hypot(current.x - previous.x, current.y - previous.y);
    const progress = current.progress - previous.progress;
    if (movement > uncertaintyPx && Math.abs(progress) > uncertaintyPx) direction = progress > 0 ? '경로 방향 이동 추정' : '반대 방향 이동 추정';
  }
  return { direction, offRoute, reroute: offRoute >= 3 };
}

export function routeEdgeRelation(graph, route, match) {
  if (!route || !match) return 'unknown';
  if (route.route.edgeIds.includes(match.edge.id)) return 'exact-edge';
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const a = nodes.get(match.edge.source), b = nodes.get(match.edge.target);
  if (!a || !b) return 'unknown';
  const ux = b.x - a.x, uy = b.y - a.y, ul = Math.hypot(ux, uy);
  if (!ul) return 'unknown';
  let crossing = false;
  for (let i = 1; i < route.points.length; i++) {
    const from = route.points[i - 1], to = route.points[i], vx = to.x - from.x, vy = to.y - from.y, vl = Math.hypot(vx, vy);
    if (!vl) continue;
    const t = Math.max(0, Math.min(1, ((match.x - from.x) * vx + (match.y - from.y) * vy) / (vl * vl)));
    const distance = Math.hypot(match.x - from.x - t * vx, match.y - from.y - t * vy);
    if (distance > 2) continue;
    if (Math.abs(ux * vy - uy * vx) / (ul * vl) < 0.09) return 'overlapping-geometry';
    crossing = true;
  }
  return crossing ? 'crossing-geometry' : 'separate-geometry';
}
