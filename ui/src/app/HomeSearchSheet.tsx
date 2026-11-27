'use client';

import Link from 'next/link';
import { useRef, useState, type PointerEvent } from 'react';

import Button, { buttonClassNames } from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import ResultItem from '@/components/ResultItem/ResultItem';
import SearchField from '@/components/SearchField/SearchField';
import StateMessage from '@/components/StateMessage/StateMessage';
import { CATEGORY_INFO, QUICK_FILTERS, ROUTE_FLOOR_LABEL, STATION } from '@/lib/station/data';
import { findRoute } from '@/lib/station/route';
import { searchPlaces } from '@/lib/station/search';
import useJourney from '@/lib/station/useJourney';

const SWIPE_THRESHOLD = 40;
const COLLAPSED_HEIGHT = 152;

interface HomeSearchSheetProps {
  view: '2d' | '3d';
  onToggleView: () => void;
}

export default function HomeSearchSheet({ view, onToggleView }: HomeSearchSheetProps) {
  const { start, href } = useJourney();
  const [expanded, setExpanded] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof QUICK_FILTERS)[number]['id'] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filter = QUICK_FILTERS.find((item) => item.id === category);
  let results = [] as ReturnType<typeof searchPlaces>;
  if (filter) results = STATION.places.filter(filter.matches);
  else if (query.trim()) results = searchPlaces(query);
  const hasSearched = Boolean(filter || query.trim());

  const close = () => {
    inputRef.current?.blur();
    setExpanded(false);
    setQuery('');
    setCategory(null);
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const { pointerId } = event;
    const startY = event.clientY;
    const startHeight =
      event.currentTarget.parentElement?.parentElement?.getBoundingClientRect().height ??
      COLLAPSED_HEIGHT;
    const sheetHeight = expanded ? startHeight : COLLAPSED_HEIGHT;
    let distance = 0;
    const controller = new AbortController();
    if (event.target instanceof HTMLElement) event.target.setPointerCapture(pointerId);
    const onMove = (move: globalThis.PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      distance = startY - move.clientY;
      setDragHeight(Math.max(COLLAPSED_HEIGHT, Math.min(startHeight, sheetHeight + distance)));
    };
    const cleanup = () => {
      controller.abort();
      setDragHeight(null);
    };
    const onUp = () => {
      cleanup();
      if (distance > SWIPE_THRESHOLD) setExpanded(true);
      else if (distance < -SWIPE_THRESHOLD) {
        inputRef.current?.blur();
        setExpanded(false);
      }
    };
    const onCancel = () => {
      cleanup();
    };
    window.addEventListener('pointermove', onMove, { signal: controller.signal });
    window.addEventListener('pointerup', onUp, { signal: controller.signal });
    window.addEventListener('pointercancel', onCancel, { signal: controller.signal });
  };

  return (
    <>
      {!expanded && (
        <div
          className="absolute left-[25px] z-20"
          style={{ bottom: (dragHeight ?? COLLAPSED_HEIGHT) + 8 }}
        >
          <Button variant="secondary" onClick={onToggleView} className="w-23 px-0">
            {view === '3d' ? '2D 보기' : '3D 보기'}
          </Button>
        </div>
      )}
      <section
        aria-label="목적지 검색"
        style={{ height: dragHeight ?? (expanded ? '100%' : COLLAPSED_HEIGHT) }}
        className={`absolute inset-x-0 bottom-0 z-20 flex min-h-0 flex-col overflow-hidden rounded-t-xl bg-surface px-[25px] pt-2 pb-5 shadow-sheet ${dragHeight === null ? 'transition-[height] duration-200' : ''}`}
      >
        <div onPointerDown={onPointerDown} className="shrink-0 touch-none">
          <div aria-hidden="true" className="-mt-2 flex h-6 w-full items-center justify-center">
            <span className="h-1 w-10 rounded-[2px] bg-map-wall" />
          </div>
          <h2 className="mt-[5px] mb-3 text-headline text-ink">어디로 가시나요?</h2>
        </div>
        <div className="flex items-center gap-3">
          <SearchField
            inputRef={inputRef}
            value={query}
            placeholder="목적지나 시설 이름을 검색하세요"
            onFocus={() => setExpanded(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setCategory(null);
            }}
            onClear={() => setQuery('')}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={close}
            className={expanded ? buttonClassNames('text') : 'hidden'}
          >
            취소
          </button>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {hasSearched && results.length > 0 && (
            <section
              aria-label="검색 결과"
              className="rounded-lg border border-line bg-surface p-4"
            >
              <p aria-live="polite" className="mb-2 text-label text-ink">
                {filter ? `${filter.label} ${results.length}곳` : `검색 결과 ${results.length}곳`}
              </p>
              <ul>
                {results.map((place) => {
                  const route = place.routeNodeId
                    ? findRoute(start.nodeId, place.routeNodeId)
                    : null;
                  return (
                    <li key={place.id}>
                      <ResultItem
                        icon={CATEGORY_INFO[place.category].icon}
                        name={place.name}
                        meta={`${ROUTE_FLOOR_LABEL} · ${route ? `약 ${route.minutes}분` : '위치 확인 필요'}`}
                        onClick={() => window.location.assign(href('/route', { to: place.id }))}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {hasSearched && results.length === 0 && <StateMessage type="empty" />}
          <p className="mt-4 rounded-md bg-brand-soft px-3.5 py-3 text-note text-ink-sub">
            목적지를 선택하면 경로를 먼저 확인할 수 있어요.
          </p>
          <Link href={href('/platform')} className={`${buttonClassNames('secondary', true)} mt-7`}>
            <Icon name="train" size={20} />
            타는 곳 번호로 찾기
          </Link>
          <div role="group" aria-label="바로가기" className="mt-3 flex gap-2.5">
            {QUICK_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => {
                  setCategory(category === item.id ? null : item.id);
                  setQuery('');
                }}
                className="min-w-0 flex-1 rounded-full border border-line-strong px-2 py-3 text-label text-ink-sub aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-color"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
