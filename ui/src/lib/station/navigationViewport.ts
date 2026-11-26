import type { MapPoint } from './types';
import type { NavigationSegment } from './navigation';

export interface NavigationViewport {
  rotation: number;
  scale: number;
  tx: number;
  ty: number;
  project: (point: MapPoint) => { x: number; y: number };
}

export function navigationViewport(
  segment: NavigationSegment,
  width: number,
  height: number,
): NavigationViewport {
  const rotation = segment.instructionType === 'STAIRS'
    || segment.instructionType === 'ELEVATOR'
    || segment.instructionType === 'ESCALATOR'
    ? 0 : -90 - segment.heading;
  const radians = rotation * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const start = segment.geometry[0];
  const offsets = segment.geometry.map(([x, y]) => ({
    x: (x - start[0]) * cos - (y - start[1]) * sin,
    y: (x - start[0]) * sin + (y - start[1]) * cos,
  }));
  const padding = Math.min(48, width * 0.12, height * 0.12);
  const topInset = Math.min(120, height * 0.3);
  const startY = height * 0.74;
  const maxX = Math.max(1, ...offsets.map((point) => Math.abs(point.x)));
  const above = Math.max(1, ...offsets.map((point) => -point.y));
  const below = Math.max(1, ...offsets.map((point) => point.y));
  const scale = Math.max(0.01, Math.min(
    2,
    (width / 2 - padding) / maxX,
    (startY - topInset) / above,
    (height - startY - padding) / below,
  ));
  const tx = width / 2 - scale * (cos * start[0] - sin * start[1]);
  const ty = startY - scale * (sin * start[0] + cos * start[1]);
  return {
    rotation, scale, tx, ty,
    project: ([x, y]) => ({
      x: scale * (cos * x - sin * y) + tx,
      y: scale * (sin * x + cos * y) + ty,
    }),
  };
}
