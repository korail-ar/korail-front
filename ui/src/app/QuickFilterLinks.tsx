import Link from 'next/link';

import { CATEGORY_CHIP_CLASS_NAMES } from '@/components/CategoryChip/CategoryChip';
import Icon from '@/components/Icon/Icon';
import cn from '@/lib/cn';
import type { QUICK_FILTERS } from '@/lib/station/data';
import type { Journey } from '@/lib/station/useJourney';

interface QuickFilterLinksProps {
  filters: typeof QUICK_FILTERS;
  href: Journey['href'];
}

/** 홈 화면 바로가기(정류장 · 출구 · 화장실). 누르면 그 분류로 검색 화면을 연다. */
export default function QuickFilterLinks({ filters, href }: QuickFilterLinksProps) {
  return (
    <nav aria-label="바로가기" className="flex gap-2.5">
      {filters.map((filter) => (
        <Link
          key={filter.id}
          href={href('/search', { category: filter.id })}
          className={cn(CATEGORY_CHIP_CLASS_NAMES, 'min-w-0 flex-1 px-2')}
        >
          <Icon name={filter.icon} size={18} />
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}
