'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import AppBar from '@/components/AppBar/AppBar';
import { buttonClassNames } from '@/components/Button/Button';
import CategoryChip from '@/components/CategoryChip/CategoryChip';
import Icon from '@/components/Icon/Icon';
import ResultItem from '@/components/ResultItem/ResultItem';
import ScreenBody from '@/components/ScreenBody/ScreenBody';
import SearchField from '@/components/SearchField/SearchField';
import StateMessage from '@/components/StateMessage/StateMessage';
import Tag from '@/components/Tag/Tag';
import cn from '@/lib/cn';
import {
  CATEGORY_INFO,
  QUICK_FILTERS,
  ROUTE_FLOOR_LABEL,
  STATION,
  isQuickFilterId,
  type QuickFilterId,
} from '@/lib/station/data';
import { findRoute } from '@/lib/station/route';
import { searchPlaces } from '@/lib/station/search';
import type { StationPlace } from '@/lib/station/types';
import useJourney from '@/lib/station/useJourney';

export default function SearchScreen() {
  const router = useRouter();
  const { params, start, href } = useJourney();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const initialCategory = params.get('category');
  const [category, setCategory] = useState<QuickFilterId | null>(
    isQuickFilterId(initialCategory) ? initialCategory : null,
  );

  // 뒤로 왔을 때 검색어·분류가 남아 있도록 주소에도 적어 둔다(기록은 쌓지 않는다).
  const syncUrl = (nextQuery: string, nextCategory: QuickFilterId | null) => {
    router.replace(href('/search', { q: nextQuery, category: nextCategory }), { scroll: false });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setCategory(null);
    syncUrl(value, null);
  };

  const handleCategoryToggle = (id: QuickFilterId) => {
    const next = category === id ? null : id;
    setCategory(next);
    setQuery('');
    syncUrl('', next);
  };

  const filter = QUICK_FILTERS.find((item) => item.id === category);
  let results: StationPlace[] = [];
  if (filter) {
    results = STATION.places.filter(filter.matches);
  } else if (query.trim()) {
    results = searchPlaces(query);
  }
  const hasSearched = Boolean(filter) || query.trim() !== '';

  const describe = (place: StationPlace) => {
    const route = place.routeNodeId ? findRoute(start.nodeId, place.routeNodeId) : null;
    const where = route ? `약 ${route.minutes}분` : '위치 확인 필요';
    return `${ROUTE_FLOOR_LABEL} · ${where}`;
  };

  return (
    <>
      <AppBar title="대전역 실내 길찾기" />
      <ScreenBody>
        <Link
          href={href('/start', { next: href('/search', { q: query, category }) })}
          aria-label={`출발 위치 ${start.name} · 바꾸기`}
          className="mt-2 self-start rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {/* Figma W04: Tag/Start 인스턴스에 흰 바탕·테두리를 덮어씀 */}
          <Tag
            label={`출발: ${start.name}`}
            variant="start"
            className="border border-line bg-surface"
          />
        </Link>
        <h2 className="mt-5 text-screen-title text-ink">어디로 가시나요?</h2>
        <div className="mt-4 flex items-center gap-3">
          <SearchField
            // 홈에서 검색창을 눌러 들어오므로 바로 입력할 수 있게 한다.
            autoFocus
            value={query}
            placeholder="목적지나 시설 이름을 검색하세요"
            onChange={(event) => handleQueryChange(event.target.value)}
            onClear={() => handleQueryChange('')}
            className="min-w-0 flex-1"
          />
          <Link href={href('/')} className={cn(buttonClassNames('text'), 'shrink-0')}>
            취소
          </Link>
        </div>

        {hasSearched && results.length > 0 && (
          <section
            aria-label="검색 결과"
            // 화면이 낮으면 결과 카드만 줄어들고(최소 160px) 목록이 카드 안에서 스크롤된다.
            className="mt-3 flex min-h-40 flex-col gap-2 rounded-lg border border-line bg-surface p-4"
          >
            <p aria-live="polite" className="text-label text-ink">
              {filter ? `${filter.label} ${results.length}곳` : `검색 결과 ${results.length}곳`}
            </p>
            <ul className="flex min-h-0 flex-col overflow-y-auto">
              {results.map((place) => (
                <li key={place.id}>
                  <ResultItem
                    icon={CATEGORY_INFO[place.category].icon}
                    name={place.name}
                    meta={describe(place)}
                    onClick={() => router.push(href('/route', { to: place.id }))}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {hasSearched && results.length === 0 && <StateMessage type="empty" className="mt-3" />}

        <p className="mt-4 rounded-md bg-brand-soft px-3.5 py-3 text-note text-ink-sub">
          목적지를 선택하면 경로를 먼저 확인할 수 있어요.
        </p>
        <Link href={href('/platform')} className={cn(buttonClassNames('secondary', true), 'mt-7')}>
          <Icon name="train" size={20} />
          타는 곳 번호로 찾기
        </Link>
        <div role="group" aria-label="바로가기" className="mt-3 flex gap-2.5">
          {QUICK_FILTERS.map((item) => (
            <CategoryChip
              key={item.id}
              icon={item.icon}
              label={item.label}
              selected={category === item.id}
              onClick={() => handleCategoryToggle(item.id)}
              className="min-w-0 flex-1 px-2"
            />
          ))}
        </div>
      </ScreenBody>
    </>
  );
}
