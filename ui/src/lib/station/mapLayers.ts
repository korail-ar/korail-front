import { CATEGORY_INFO, findNode } from './data';
import type { MapPoint } from './types';
import type { Journey } from './useJourney';

/** 경로 화면들(W06~W09)이 공통으로 지도에 올리는 출발 위치·목적지·경로선. */
export default function getJourneyMapLayers({ start, destination, route }: Journey) {
  const startNode = findNode(start.nodeId);
  const startPoint: MapPoint | null = startNode ? [startNode.x, startNode.y] : null;
  const destinationPoint = route?.points[route.points.length - 1] ?? null;

  return {
    route: route?.points,
    start: startPoint ? { point: startPoint, label: start.name } : undefined,
    destination:
      destination && destinationPoint
        ? {
            point: destinationPoint,
            label: destination.name,
            icon: CATEGORY_INFO[destination.category].icon,
          }
        : undefined,
  };
}
