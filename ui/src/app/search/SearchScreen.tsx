'use client';

import Link from 'next/link';

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
import { CATEGORY_INFO, QUICK_FILTERS } from '@/lib/station/data';
import useSearchViewModel from '@/view-models/useSearchViewModel';

export default function SearchScreen() {
  const vm = useSearchViewModel();

  return (
    <>
      <AppBar title="대전역 실내 길찾기" />
      <ScreenBody>
        <Link
          href={vm.startHref}
          aria-label={`출발 위치 ${vm.startName} · 바꾸기`}
          className="mt-2 self-start rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {/* Figma W04: Tag/Start 인스턴스에 흰 바탕·테두리를 덮어씀 */}
          <Tag
            label={`출발: ${vm.startName}`}
            variant="start"
            className="border border-line bg-surface"
          />
        </Link>
        <h2 className="mt-5 text-screen-title text-ink">어디로 가시나요?</h2>
        <div className="mt-4 flex items-center gap-3">
          <SearchField
            // 홈에서 검색창을 눌러 들어오므로 바로 입력할 수 있게 한다.
            autoFocus
            value={vm.query}
            placeholder="목적지나 시설 이름을 검색하세요"
            onChange={(event) => vm.changeQuery(event.target.value)}
            onClear={() => vm.changeQuery('')}
            className="min-w-0 flex-1"
          />
          <Link href={vm.homeHref} className={cn(buttonClassNames('text'), 'shrink-0')}>
            취소
          </Link>
        </div>

        {vm.hasSearched && vm.results.length > 0 && (
          <section
            aria-label="검색 결과"
            // 화면이 낮으면 결과 카드만 줄어들고(최소 160px) 목록이 카드 안에서 스크롤된다.
            className="mt-3 flex min-h-40 flex-col gap-2 rounded-lg border border-line bg-surface p-4"
          >
            <p aria-live="polite" className="text-label text-ink">
              {vm.filter
                ? `${vm.filter.label} ${vm.results.length}곳`
                : `검색 결과 ${vm.results.length}곳`}
            </p>
            <ul className="flex min-h-0 flex-col overflow-y-auto">
              {vm.results.map((place) => (
                <li key={place.id}>
                  <ResultItem
                    icon={CATEGORY_INFO[place.category].icon}
                    name={place.name}
                    meta={vm.describe(place)}
                    onClick={() => vm.selectPlace(place)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {vm.hasSearched && vm.results.length === 0 && (
          <StateMessage type="empty" className="mt-3" />
        )}

        <p className="mt-4 rounded-md bg-brand-soft px-3.5 py-3 text-note text-ink-sub">
          목적지를 선택하면 경로를 먼저 확인할 수 있어요.
        </p>
        <Link href={vm.platformHref} className={cn(buttonClassNames('secondary', true), 'mt-7')}>
          <Icon name="train" size={20} />
          타는 곳 번호로 찾기
        </Link>
        <div role="group" aria-label="바로가기" className="mt-3 flex gap-2.5">
          {QUICK_FILTERS.map((item) => (
            <CategoryChip
              key={item.id}
              icon={item.icon}
              label={item.label}
              selected={vm.category === item.id}
              onClick={() => vm.toggleCategory(item.id)}
              className="min-w-0 flex-1 px-2"
            />
          ))}
        </div>
      </ScreenBody>
    </>
  );
}
