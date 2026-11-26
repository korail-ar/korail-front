'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { MAP_VIEWBOXES, type MapFloor } from '@/lib/station/data';
import type { NavigationSegment } from '@/lib/station/navigation';
import { navigationViewport } from '@/lib/station/navigationViewport';

interface Props {
  segment: NavigationSegment;
  previous: readonly NavigationSegment[];
  endLabel: string;
}

function pointsOf(segment: NavigationSegment): string {
  return segment.geometry.map(([x, y]) => `${x},${y}`).join(' ');
}

function currentIsWalk(segment: NavigationSegment): boolean {
  return !['STAIRS', 'ESCALATOR', 'ELEVATOR'].includes(segment.instructionType);
}

export default function StepNavigationMap({ segment, previous, endLabel }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [planMarkup, setPlanMarkup] = useState('');
  const floor = segment.floor as MapFloor;
  const bounds = MAP_VIEWBOXES[floor];

  useEffect(() => {
    const element = container.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/maps/web-${floor}-map.svg`).then((response) => response.text()).then((source) => {
      const document = new DOMParser().parseFromString(source, 'image/svg+xml');
      const svg = document.documentElement;
      svg.setAttribute('x', String(bounds[0]));
      svg.setAttribute('y', String(bounds[1]));
      svg.setAttribute('width', String(bounds[2]));
      svg.setAttribute('height', String(bounds[3]));
      svg.querySelectorAll('text').forEach((label) => {
        if (!label.closest(`g[id^="${floor}-P"]`)) label.classList.add('upright-label');
      });
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = `.upright-label, g[id^="${floor}-P"] { transform-box: fill-box; transform-origin: center; rotate: var(--label-counter-rotation); }`;
      svg.prepend(style);
      if (active) setPlanMarkup(new XMLSerializer().serializeToString(svg));
    }).catch(() => { if (active) setPlanMarkup(''); });
    return () => { active = false; };
  }, [floor, bounds]);

  const viewport = useMemo(
    () => size.width && size.height
      ? navigationViewport(segment, size.width, size.height)
      : null,
    [segment, size],
  );
  const start = viewport?.project(segment.geometry[0]);
  const end = viewport?.project(segment.geometry[segment.geometry.length - 1]);
  const radians = (viewport?.rotation ?? 0) * Math.PI / 180;
  const scale = viewport?.scale ?? 1;
  const a = scale * Math.cos(radians);
  const b = scale * Math.sin(radians);
  const c = -scale * Math.sin(radians);
  const d = scale * Math.cos(radians);

  return (
    <div ref={container} className="relative min-h-40 flex-1 basis-0 overflow-hidden bg-surface" aria-label={`${floor} 현재 이동 구간 지도`}>
      {viewport && (
        <>
          <svg width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
            <g
              style={{
                transform: `matrix(${a}, ${b}, ${c}, ${d}, ${viewport.tx}, ${viewport.ty})`,
                transformOrigin: '0 0',
                transition: 'transform 420ms ease',
                ['--label-counter-rotation' as string]: `${-viewport.rotation}deg`,
              }}
            >
              {/* SVG files are controlled repository assets. Embedded labels counter-rotate. */}
              {/* eslint-disable-next-line react/no-danger -- This SVG is fetched from the repository's own map asset. */}
              <g dangerouslySetInnerHTML={{ __html: planMarkup }} />
              {previous.filter((item) => item.floor === floor).map((item) => (
                <polyline key={item.id} points={pointsOf(item)} fill="none" stroke="#77869b" strokeOpacity="0.4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {segment.geometry.length > 1 && (
                <polyline points={pointsOf(segment)} fill="none" stroke="var(--color-brand)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          </svg>
          {start && currentIsWalk(segment) && (
            <span className="pointer-events-none absolute z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brand text-xl text-white shadow-md transition-all duration-[420ms]" style={{ left: start.x, top: start.y }} aria-hidden="true">↑</span>
          )}
          {end && (
            <span className="pointer-events-none absolute z-10 max-w-40 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 text-center text-note text-white shadow-md transition-all duration-[420ms]" style={{ left: end.x, top: end.y }} aria-hidden="true">{endLabel}</span>
          )}
          <span className="absolute top-3 left-3 rounded-md bg-surface px-2 py-1 text-note text-ink shadow">{floor}</span>
        </>
      )}
    </div>
  );
}
