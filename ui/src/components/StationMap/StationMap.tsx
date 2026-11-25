'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';

import type { IconName } from '@/components/Icon/Icon';
import FloorControl from '@/components/MapControl/FloorControl';
import RecenterControl from '@/components/MapControl/RecenterControl';
import ZoomControl from '@/components/MapControl/ZoomControl';
import MapLabel from '@/components/MapLabel/MapLabel';
import MapMarker from '@/components/MapMarker/MapMarker';
import RouteLine from '@/components/RouteLine/RouteLine';
import cn from '@/lib/cn';
import {
  FLOOR_LABELS,
  MAP_FLOORS,
  MAP_VIEWBOXES,
  ROUTE_FLOOR,
  type MapFloor,
} from '@/lib/station/data';
import type { MapPoint } from '@/lib/station/types';

interface LabeledPoint {
  point: MapPoint;
  label: string;
}

interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface StationMapProps {
  /** 지도 높이 등 바깥 크기 */
  className?: string;
  /** 화면에서 남는 높이를 모두 쓴다(최소 160px). 화면이 낮으면 지도가 먼저 줄어든다. */
  fill?: boolean;
  route?: readonly MapPoint[];
  /** 층이 바뀌는 구간은 점선으로 그린다(W09). */
  isTransferRoute?: boolean;
  start?: LabeledPoint;
  destination?: LabeledPoint & { icon: IconName };
  /** 층 이동 지점(W09) */
  floorPoint?: LabeledPoint & { icon: IconName };
  /** 지금 단계가 시작되는 지점(W07) */
  stepPoint?: { point: MapPoint; step: number };
  /** 처음 보여줄 범위(없으면 route → start 순). 다시 맞추기 버튼도 이 범위로 돌아간다. */
  focus?: readonly MapPoint[];
  /** 지도 위에 겹쳐 놓은 요소(카드·패널)를 피해서 맞추기 위한 여백(px) */
  focusInsets?: Partial<Insets>;
  caption?: string;
  showFloorControl?: boolean;
  showZoomControl?: boolean;
  recenterPlacement?: 'below-zoom' | 'bottom-right' | 'none';
}

interface View {
  cx: number;
  cy: number;
  zoom: number;
}

const DEFAULT_INSETS: Insets = { top: 56, right: 72, bottom: 40, left: 72 };
const ZOOM_STEP = 1.4;
const MAX_ZOOM = 2;
// 부동소수점 오차로 축소 버튼이 한계에서 켜져 있는 일을 막는다.
const ZOOM_EPSILON = 0.0001;
// 한 점만 맞출 때(시작 위치만 있을 때) 주변이 이만큼(지도 단위) 보이게 한다.
const SINGLE_POINT_SPAN = 360;
const KEYBOARD_PAN_PX = 40;
// 목적지 핀(46×60)의 끝이 실제 위치다.
const PIN_TIP = { x: 23, y: 57 };

function boundsOf(points: readonly MapPoint[]) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

interface Size {
  width: number;
  height: number;
}
type Bounds = readonly [x: number, y: number, width: number, height: number];

/** 지도가 지도 상자를 빈틈없이 덮는 가장 작은 배율(cover). 이보다 작아지면 지도 밖이 보인다. */
function coverZoom(size: Size, [, , width, height]: Bounds): number {
  return Math.max(size.width / width, size.height / height);
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * 지도 밖이 보이지 않게 배율과 중심을 지도(viewBox) 안으로 맞춘다.
 * 끌기·확대·다시 맞추기 등 보기를 바꾸는 모든 곳이 이 함수를 거친다.
 */
function clampView(view: View, size: Size, bounds: Bounds): View {
  const [x, y, width, height] = bounds;
  const minZoom = coverZoom(size, bounds);
  const zoom = clamp(view.zoom, minZoom, Math.max(MAX_ZOOM, minZoom));
  const halfWidth = size.width / 2 / zoom;
  const halfHeight = size.height / 2 / zoom;
  return {
    zoom,
    cx: clamp(view.cx, x + halfWidth, x + width - halfWidth),
    cy: clamp(view.cy, y + halfHeight, y + height - halfHeight),
  };
}

function fitView(points: readonly MapPoint[], size: Size, insets: Insets): View {
  const { minX, maxX, minY, maxY } = boundsOf(points);
  const spanX = Math.max(maxX - minX, SINGLE_POINT_SPAN);
  const spanY = Math.max(maxY - minY, SINGLE_POINT_SPAN);
  const innerWidth = Math.max(size.width - insets.left - insets.right, 1);
  const innerHeight = Math.max(size.height - insets.top - insets.bottom, 1);
  const zoom = Math.min(innerWidth / spanX, innerHeight / spanY, MAX_ZOOM);
  // 여백이 한쪽으로 치우치면 그만큼 중심을 옮긴다.
  const offsetX = (insets.left - insets.right) / 2 / zoom;
  const offsetY = (insets.top - insets.bottom) / 2 / zoom;
  return { cx: (minX + maxX) / 2 - offsetX, cy: (minY + maxY) / 2 - offsetY, zoom };
}

/**
 * 대전역 2D 지도(디자인팀 web-xF-map.svg) 위에 경로선과 표시를 올린다.
 * 끌어서 이동, 두 손가락·휠로 확대, 방향키로 이동할 수 있다. 경로는 3층에만 있다.
 */
export default function StationMap({
  className,
  fill = false,
  route,
  isTransferRoute = false,
  start,
  destination,
  floorPoint,
  stepPoint,
  focus,
  focusInsets,
  caption,
  showFloorControl = true,
  showZoomControl = true,
  recenterPlacement = 'below-zoom',
}: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [floor, setFloor] = useState<MapFloor>(ROUTE_FLOOR);
  const [view, setView] = useState<View | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const bounds = MAP_VIEWBOXES[floor];
  const [vbX, vbY, vbWidth, vbHeight] = bounds;
  const isRouteFloor = floor === ROUTE_FLOOR;
  const minZoom = size ? coverZoom(size, bounds) : 0;

  const focusPoints = focus ?? route ?? (start ? [start.point] : null);
  // 같은 범위면 다시 맞추지 않도록 값으로 비교한다(배열은 렌더마다 새로 만들어진다).
  const focusKey = focusPoints ? JSON.stringify(focusPoints) : '';
  const insetsKey = JSON.stringify(focusInsets ?? {});

  const computeFit = useCallback((): View | null => {
    if (!size) {
      return null;
    }
    const mapBounds: Bounds = [vbX, vbY, vbWidth, vbHeight];
    if (isRouteFloor && focusKey) {
      const insets = { ...DEFAULT_INSETS, ...JSON.parse(insetsKey) };
      return clampView(fitView(JSON.parse(focusKey), size, insets), size, mapBounds);
    }
    // 경로가 없는 층은 지도 가운데를 가장 넓게(지도가 상자를 덮는 배율로) 보여준다.
    const whole = { cx: vbX + vbWidth / 2, cy: vbY + vbHeight / 2, zoom: 0 };
    return clampView(whole, size, mapBounds);
  }, [size, focusKey, insetsKey, isRouteFloor, vbX, vbY, vbWidth, vbHeight]);

  const recenter = () => setView(computeFit());

  // 크기·층·보여줄 범위가 바뀌면 다시 맞춘다. effect 대신 렌더 중에 맞춰서 한 번 더 그리는 일을 없앤다.
  const fitKey = size ? `${floor}|${size.width}x${size.height}|${focusKey}|${insetsKey}` : null;
  const [fittedKey, setFittedKey] = useState<string | null>(null);
  if (fitKey !== null && fitKey !== fittedKey) {
    setFittedKey(fitKey);
    setView(computeFit());
  }

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const zoomBy = (factor: number, anchor?: { x: number; y: number }) => {
    setView((prev) => {
      if (!prev || !size) {
        return prev;
      }
      const zoom = clamp(prev.zoom * factor, minZoom, Math.max(MAX_ZOOM, minZoom));
      if (!anchor) {
        return clampView({ ...prev, zoom }, size, bounds);
      }
      // anchor(화면 좌표) 아래의 지도 위치가 그대로 있도록 중심을 옮긴다.
      const mapX = prev.cx + (anchor.x - size.width / 2) / prev.zoom;
      const mapY = prev.cy + (anchor.y - size.height / 2) / prev.zoom;
      const next = {
        zoom,
        cx: mapX - (anchor.x - size.width / 2) / zoom,
        cy: mapY - (anchor.y - size.height / 2) / zoom,
      };
      return clampView(next, size, bounds);
    });
  };

  const panBy = (dx: number, dy: number) => {
    setView((prev) => {
      if (!prev || !size) {
        return prev;
      }
      const next = { ...prev, cx: prev.cx - dx / prev.zoom, cy: prev.cy - dy / prev.zoom };
      return clampView(next, size, bounds);
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) {
      return;
    }
    const current = { x: event.clientX, y: event.clientY };
    if (pointers.current.size === 2) {
      const [other] = [...pointers.current.entries()].filter(([id]) => id !== event.pointerId);
      const otherPoint = other[1];
      const before = Math.hypot(previous.x - otherPoint.x, previous.y - otherPoint.y);
      const after = Math.hypot(current.x - otherPoint.x, current.y - otherPoint.y);
      const rect = event.currentTarget.getBoundingClientRect();
      if (before > 0) {
        zoomBy(after / before, {
          x: (current.x + otherPoint.x) / 2 - rect.left,
          y: (current.y + otherPoint.y) / 2 - rect.top,
        });
      }
    } else {
      panBy(current.x - previous.x, current.y - previous.y);
    }
    pointers.current.set(event.pointerId, current);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    zoomBy(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, KEYBOARD_PAN_PX],
      ArrowDown: [0, -KEYBOARD_PAN_PX],
      ArrowLeft: [KEYBOARD_PAN_PX, 0],
      ArrowRight: [-KEYBOARD_PAN_PX, 0],
    };
    if (event.key in moves) {
      event.preventDefault();
      panBy(...moves[event.key]);
    } else if (event.key === '+' || event.key === '=') {
      zoomBy(ZOOM_STEP);
    } else if (event.key === '-') {
      zoomBy(1 / ZOOM_STEP);
    }
  };

  const toScreen = ([x, y]: MapPoint) =>
    view && size
      ? {
          left: (x - view.cx) * view.zoom + size.width / 2,
          top: (y - view.cy) * view.zoom + size.height / 2,
        }
      : { left: 0, top: 0 };

  const viewBox =
    view && size
      ? [
          view.cx - size.width / 2 / view.zoom,
          view.cy - size.height / 2 / view.zoom,
          size.width / view.zoom,
          size.height / view.zoom,
        ].join(' ')
      : `${vbX} ${vbY} ${vbWidth} ${vbHeight}`;

  const floorLabel = FLOOR_LABELS[floor];
  const isReady = view !== null && size !== null;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface',
        fill && 'min-h-40 flex-1 basis-0',
        className,
      )}
    >
      {/* 지도는 끌기·확대·방향키를 직접 처리하는 위젯(role=application)이라 포커스와 입력을 받는다. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={containerRef}
        role="application"
        aria-label={`${floorLabel} 지도. 방향키로 이동, +·- 키로 확대·축소`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 cursor-grab touch-none select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus active:cursor-grabbing"
      >
        {isReady && (
          <>
            <svg width={size.width} height={size.height} viewBox={viewBox} aria-hidden>
              <image
                href={`/maps/web-${floor}-map.svg`}
                x={vbX}
                y={vbY}
                width={vbWidth}
                height={vbHeight}
              />
              {isRouteFloor && route && route.length > 1 && (
                <RouteLine points={route} transfer={isTransferRoute} nonScaling />
              )}
            </svg>
            {isRouteFloor && (
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {start && (
                  <span
                    className="absolute flex -translate-x-1/2 -translate-y-[18px] flex-col items-center gap-1"
                    style={toScreen(start.point)}
                  >
                    <MapMarker type="start" />
                    <MapLabel label={start.label} variant="start" />
                  </span>
                )}
                {floorPoint && (
                  <span
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={toScreen(floorPoint.point)}
                  >
                    {/* 지도 가장자리에서 잘리지 않도록 이름은 마커 위 가운데에 둔다. */}
                    <MapLabel
                      label={floorPoint.label}
                      variant="floor"
                      className="absolute bottom-full mb-1"
                    />
                    <MapMarker type="floor" icon={floorPoint.icon} />
                  </span>
                )}
                {stepPoint && (
                  <span
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={toScreen(stepPoint.point)}
                  >
                    <MapMarker type="step" step={stepPoint.step} />
                  </span>
                )}
                {destination && (
                  <span
                    className="absolute flex flex-col items-center"
                    style={{
                      ...toScreen(destination.point),
                      transform: `translate(-${PIN_TIP.x}px, calc(-${PIN_TIP.y}px - 24px))`,
                    }}
                  >
                    <MapLabel label={destination.label} variant="strong" className="mb-1" />
                    <MapMarker type="destination" icon={destination.icon} />
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showFloorControl && (
        <FloorControl
          floors={MAP_FLOORS}
          value={floor}
          onChange={(value) => setFloor(value as MapFloor)}
          // 화면이 낮아 지도가 줄면(최소 160px) 층 버튼 4개(192px)가 넘치므로 지도 높이 안에서 스크롤되게 한다.
          className="absolute top-3 left-3 max-h-[calc(100%-1.5rem)] overflow-y-auto [&>*]:shrink-0"
        />
      )}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {showZoomControl && (
          <ZoomControl
            onZoomIn={() => zoomBy(ZOOM_STEP)}
            onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
            canZoomIn={!view || view.zoom < Math.max(MAX_ZOOM, minZoom) - ZOOM_EPSILON}
            canZoomOut={!view || view.zoom > minZoom + ZOOM_EPSILON}
          />
        )}
        {recenterPlacement === 'below-zoom' && <RecenterControl onRecenter={recenter} />}
      </div>
      {recenterPlacement === 'bottom-right' && (
        <RecenterControl onRecenter={recenter} className="absolute right-4 bottom-4" />
      )}
      {(caption || !isRouteFloor) && (
        <p className="pointer-events-none absolute bottom-2 left-5 text-note text-ink-mute">
          {isRouteFloor ? caption : `${floorLabel} 지도 · 경로 안내는 3층만 준비되어 있어요`}
        </p>
      )}
    </div>
  );
}
