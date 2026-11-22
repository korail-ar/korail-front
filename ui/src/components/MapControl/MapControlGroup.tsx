import type { ReactNode } from 'react';

import cn from '@/lib/cn';

interface MapControlGroupProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** 지도 컨트롤 버튼을 세로로 묶는 흰 상자(그림자 shadow-float). 버튼 사이에는 구분선을 둔다. */
export default function MapControlGroup({ label, children, className }: MapControlGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex flex-col overflow-hidden rounded-md bg-surface shadow-float',
        '[&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-line',
        className,
      )}
    >
      {children}
    </div>
  );
}
