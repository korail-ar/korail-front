import Link from 'next/link';

import Icon from '@/components/Icon/Icon';
import cn from '@/lib/cn';

interface AppBarProps {
  title: string;
  /** 뒤로 갈 주소. 없으면 뒤로 버튼을 두지 않는다(홈 화면). */
  backHref?: string;
  className?: string;
}

/** 화면 맨 위 제목 줄(높이 60px). 뒤로는 IconButton과 같은 모양의 링크다. */
export default function AppBar({ title, backHref, className }: AppBarProps) {
  return (
    <header className={cn('flex h-15 shrink-0 items-center gap-3 px-4', className)}>
      {backHref && (
        <Link
          href={backHref}
          aria-label="뒤로"
          className={cn(
            'inline-flex size-tap-min shrink-0 items-center justify-center rounded-md border border-line',
            'bg-surface text-ink transition-colors active:bg-surface-sunken',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          )}
        >
          <Icon name="chev-left" size={24} />
        </Link>
      )}
      <h1 className={cn('min-w-0 truncate text-body-lg text-ink', !backHref && 'px-1')}>{title}</h1>
    </header>
  );
}
