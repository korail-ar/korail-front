export function trackingViewBox(full, point, zoom = 2.7) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return full;
  const [left, top, width, height] = full;
  const viewWidth = width / zoom, viewHeight = height / zoom;
  const x = Math.max(left, Math.min(left + width - viewWidth, point.x - viewWidth / 2));
  const y = Math.max(top, Math.min(top + height - viewHeight, point.y - viewHeight / 2));
  return [x, y, viewWidth, viewHeight];
}
