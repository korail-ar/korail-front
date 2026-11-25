'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
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

/** 검색 입력, 분류, 결과와 화면 이동을 한곳에서 관리한다. */
export default function useSearchViewModel() {
  const router = useRouter();
  const { params, start, href } = useJourney();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const initialCategory = params.get('category');
  const [category, setCategory] = useState<QuickFilterId | null>(
    isQuickFilterId(initialCategory) ? initialCategory : null,
  );

  const syncUrl = (nextQuery: string, nextCategory: QuickFilterId | null) => {
    router.replace(href('/search', { q: nextQuery, category: nextCategory }), { scroll: false });
  };
  const changeQuery = (value: string) => {
    setQuery(value);
    setCategory(null);
    syncUrl(value, null);
  };
  const toggleCategory = (id: QuickFilterId) => {
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
  const describe = (place: StationPlace) => {
    const route = place.routeNodeId ? findRoute(start.nodeId, place.routeNodeId) : null;
    return `${ROUTE_FLOOR_LABEL} · ${route ? `약 ${route.minutes}분` : '위치 확인 필요'}`;
  };

  return {
    startName: start.name,
    query,
    category,
    filter,
    results,
    hasSearched: Boolean(filter) || query.trim() !== '',
    changeQuery,
    toggleCategory,
    describe,
    selectPlace: (place: StationPlace) => router.push(href('/route', { to: place.id })),
    startHref: href('/start', { next: href('/search', { q: query, category }) }),
    homeHref: href('/'),
    platformHref: href('/platform'),
  };
}
