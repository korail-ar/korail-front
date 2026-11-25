import type { ReactNode } from 'react';

import cn from '@/lib/cn';

interface ScreenBodyProps {
  children: ReactNode;
  /**
   * fill: AppBar 아래 남은 높이를 모두 쓰는 본문(지도 없는 화면).
   * panel: 지도 아래 패널. 내용 높이만큼 차지하고, 화면이 낮으면 지도가 먼저 줄어든 뒤 패널 안에서 스크롤된다.
   */
  variant?: 'fill' | 'panel';
  className?: string;
}

/**
 * 화면 본문. 앱은 화면 높이에 고정(h-dvh)되어 페이지 전체가 스크롤되지 않으므로,
 * 내용이 넘칠 때는 이 영역 안에서만 스크롤된다(AppBar는 늘 보인다).
 */
export default function ScreenBody({ children, variant = 'fill', className }: ScreenBodyProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-y-auto px-5 pb-8',
        variant === 'fill' && 'flex-1',
        className,
      )}
    >
      {children}
    </div>
  );
}
