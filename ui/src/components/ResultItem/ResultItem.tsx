import type { ButtonHTMLAttributes } from 'react';

import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

type ResultItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  name: string;
  meta: string;
};

/** 검색 결과·추천 목록의 한 줄. 항목 전체가 눌린다(최소 높이 64px). */
export default function ResultItem({
  icon,
  name,
  meta,
  type = 'button',
  className,
  ...rest
}: ResultItemProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      className={cn(
        'flex min-h-16 w-full items-center gap-3 border-b border-line py-2.5 text-left',
        'transition-colors active:bg-surface-sunken',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...rest}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg text-ink-sub">
        <Icon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-button text-ink">{name}</span>
        <span className="truncate text-caption text-ink-mute">{meta}</span>
      </span>
      <Icon name="chev-right" size={20} className="text-line-strong" />
    </button>
  );
}
