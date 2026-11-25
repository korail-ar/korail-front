'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import RecenterControl from '@/components/MapControl/RecenterControl';
import MapLabel from '@/components/MapLabel/MapLabel';
import RouteEndpoint from '@/components/RouteEndpoint/RouteEndpoint';
import cn from '@/lib/cn';
import {
  FLOOR_LABELS,
  MAP_FLOORS,
  MAP_VIEWBOXES,
  ROUTE_FLOOR,
  type MapFloor,
} from '@/lib/station/data';
import type { MapPoint } from '@/lib/station/types';

interface StationMap3DProps {
  className?: string;
  /** QR 안내 시작 위치(3층) */
  start?: { point: MapPoint; label: string };
  /** 왼쪽 아래 도구 자리(예: 2D 보기 버튼) */
  toolbarStart?: ReactNode;
}

// 처음 보기 각도(Figma 250:621 프로토타입 값).
const DEFAULT_ROTATION = -31;
const DEFAULT_TILT = 57;
const TILT_RANGE = { min: 36, max: 72 };
const ROTATE_PER_PX = 0.45;
const TILT_PER_PX = 0.22;
const KEYBOARD_ROTATE_DEG = 10;
// 층 사이 높이(px)와 바닥판 최대 폭. 지도 상자가 좁으면 폭의 72%까지만 쓴다.
const FLOOR_GAP_PX = 34;
const MAX_SLAB_WIDTH = 230;
const SLAB_WIDTH_RATIO = 0.56;
// 이만큼 움직이기 전까지는 누름(층 선택)으로 본다.
const DRAG_THRESHOLD_PX = 5;

// 네 층 지도를 모두 덮는 영역. 모든 층이 같은 좌표계라 이 영역 기준으로 겹치면 층이 정렬된다.
const UNION = (() => {
  const boxes = MAP_FLOORS.map((floor) => MAP_VIEWBOXES[floor]);
  const minX = Math.min(...boxes.map(([x]) => x));
  const minY = Math.min(...boxes.map(([, y]) => y));
  const maxX = Math.max(...boxes.map(([x, , w]) => x + w));
  const maxY = Math.max(...boxes.map(([, y, , h]) => y + h));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
})();

const toPercent = (value: number, origin: number, size: number) =>
  `${((value - origin) / size) * 100}%`;

/** 아래층부터 쌓는 순서 */
const FLOORS_BOTTOM_UP = [...MAP_FLOORS].reverse();

/**
 * 층별 2D 지도를 쌓아 올린 3D 보기(Figma W01 · 250:621). 끌어서 돌리고 기울이며, 층을 눌러 고른다.
 * 실내 위치 추적이 아니라 QR 안내 시작 위치만 표시한다.
 */
export default function StationMap3D({ className, start, toolbarStart }: StationMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [tilt, setTilt] = useState(DEFAULT_TILT);
  const [selectedFloor, setSelectedFloor] = useState<MapFloor>(ROUTE_FLOOR);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  // 3층 바닥판 위 출발 지점(크기 0)과, 그 화면 위치에 띄우는 출발 표시.
  const startAnchorRef = useRef<HTMLSpanElement>(null);
  const startMarkerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 출발 표시는 3D 장면 밖의 평면 요소로 그린다. 장면 안에 두면 바닥판과 함께 기울어 옆에서 본 선처럼
  // 보이고 위층 바닥판에 가려지기 때문이다. 바닥판 위 기준점의 화면 위치를 읽어 DOM에 바로 적는다.
  useLayoutEffect(() => {
    const anchor = startAnchorRef.current;
    const marker = startMarkerRef.current;
    const container = containerRef.current;
    if (!anchor || !marker || !container) {
      return;
    }
    const anchorRect = anchor.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    marker.style.left = `${anchorRect.left - containerRect.left}px`;
    marker.style.top = `${anchorRect.top - containerRect.top}px`;
    marker.style.visibility = 'visible';
  }, [rotation, tilt, width, selectedFloor, start]);

  const selectedIndex = FLOORS_BOTTOM_UP.indexOf(selectedFloor);
  const slabWidth = Math.min(MAX_SLAB_WIDTH, width * SLAB_WIDTH_RATIO);
  const slabHeight = (slabWidth * UNION.height) / UNION.width;

  const rotateBy = (dx: number, dy: number) => {
    setRotation((value) => value + dx * ROTATE_PER_PX);
    setTilt((value) =>
      Math.min(TILT_RANGE.max, Math.max(TILT_RANGE.min, value - dy * TILT_PER_PX)),
    );
  };

  const reset = () => {
    setRotation(DEFAULT_ROTATION);
    setTilt(DEFAULT_TILT);
    setSelectedFloor(ROUTE_FLOOR);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const { current } = drag;
    if (!current) {
      return;
    }
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return;
    }
    if (!current.moved) {
      // 끌기가 시작된 뒤에만 포인터를 잡는다(먼저 잡으면 층 버튼 누름이 사라진다).
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    rotateBy(dx, dy);
    drag.current = { x: event.clientX, y: event.clientY, moved: true };
  };

  const handlePointerUp = () => {
    // 끈 뒤에 바로 이어지는 click이 층 선택으로 처리되지 않게 한 틱 뒤에 지운다.
    setTimeout(() => {
      drag.current = null;
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEYBOARD_ROTATE_DEG / ROTATE_PER_PX, 0],
      ArrowRight: [KEYBOARD_ROTATE_DEG / ROTATE_PER_PX, 0],
      ArrowUp: [0, KEYBOARD_ROTATE_DEG / TILT_PER_PX],
      ArrowDown: [0, -KEYBOARD_ROTATE_DEG / TILT_PER_PX],
    };
    if (event.key in moves) {
      event.preventDefault();
      rotateBy(...moves[event.key]);
    }
  };

  const selectFloor = (floor: MapFloor) => {
    if (drag.current?.moved) {
      return;
    }
    setSelectedFloor(floor);
  };

  const sceneStyle: CSSProperties = {
    width: slabWidth,
    height: slabHeight,
    transform: `translate(-50%, -50%) rotateX(${tilt}deg) rotateZ(${rotation}deg)`,
  };

  return (
    <div className={cn('relative overflow-hidden bg-surface', className)}>
      {/* 끌어서 돌리기·방향키를 직접 처리하는 위젯이라 포커스와 입력을 받는다. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={containerRef}
        role="application"
        aria-label="대전역 층별 3D 지도. 끌거나 방향키로 돌려 볼 수 있어요"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 cursor-grab touch-none select-none [perspective:900px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus active:cursor-grabbing"
      >
        {slabWidth > 0 && (
          <div
            className="absolute top-[54%] left-1/2 [transform-style:preserve-3d]"
            style={sceneStyle}
          >
            {FLOORS_BOTTOM_UP.map((floor, index) => {
              const [x, y, w, h] = MAP_VIEWBOXES[floor];
              const isSelected = floor === selectedFloor;
              return (
                <button
                  key={floor}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${FLOOR_LABELS[floor]} 보기`}
                  onClick={() => selectFloor(floor)}
                  className={cn(
                    'absolute inset-0 rounded-xs border-[1.5px] transition-opacity [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-focus',
                    // 고른 층 위에 있는 층은 거의 투명하게 해 고른 층이 가려지지 않게 한다.
                    isSelected && 'border-brand bg-map-zone opacity-100',
                    !isSelected && index > selectedIndex && 'border-map-zone-line opacity-15',
                    !isSelected &&
                      index < selectedIndex &&
                      'border-map-zone-line bg-map-zone/70 opacity-45',
                  )}
                  style={{ transform: `translateZ(${index * FLOOR_GAP_PX}px)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 3D 변환 안에 쓰는 정적 SVG라 최적화가 필요 없다. */}
                  <img
                    src={`/maps/web-${floor}-map.svg`}
                    alt=""
                    draggable={false}
                    className="absolute max-w-none"
                    style={{
                      left: toPercent(x, UNION.x, UNION.width),
                      top: toPercent(y, UNION.y, UNION.height),
                      width: `${(w / UNION.width) * 100}%`,
                      height: `${(h / UNION.height) * 100}%`,
                    }}
                  />
                  <span className="absolute top-1.5 right-1.5 rounded-xs bg-surface px-1.5 text-map-label text-brand-press shadow-float">
                    {floor}
                  </span>
                  {start && floor === ROUTE_FLOOR && (
                    <span
                      ref={startAnchorRef}
                      aria-hidden
                      className="absolute size-0"
                      style={{
                        left: toPercent(start.point[0], UNION.x, UNION.width),
                        top: toPercent(start.point[1], UNION.y, UNION.height),
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {start && (
        <span
          ref={startMarkerRef}
          aria-hidden
          // 위치는 렌더 뒤 기준점에서 읽어 넣는다. 읽기 전에는 숨겨 둔다.
          className="pointer-events-none invisible absolute flex -translate-x-1/2 -translate-y-3 flex-col items-center gap-1"
        >
          <RouteEndpoint type="start" />
          <MapLabel label={start.label} variant="start" />
        </span>
      )}
      <p className="pointer-events-none absolute top-[78px] left-1/2 -translate-x-1/2 rounded-full bg-surface/90 px-2.5 py-1 text-note whitespace-nowrap text-ink-mute shadow-float">
        <span aria-hidden className="mr-1 font-bold text-brand-press">
          ↔
        </span>
        손으로 돌려보세요
      </p>
      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-3">
        {toolbarStart}
        <p aria-live="polite" className="text-note text-ink-sub">
          {`${FLOOR_LABELS[selectedFloor]} 보기`}
        </p>
        <RecenterControl onRecenter={reset} />
      </div>
    </div>
  );
}
