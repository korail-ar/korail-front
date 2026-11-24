'use client';

import { useId, useState, type ReactNode } from 'react';

import cn from '@/lib/cn';

interface BottomSheetProps {
  title: string;
  /** 결과 목록 · FacilityCard · RouteSummary · StepItem 중 하나만 넣는다(패널 위에 패널을 겹치지 않음). */
  children?: ReactNode;
  /** 주요 버튼. 맨 아래 가로를 꽉 채운다. */
  footer?: ReactNode;
  defaultExpanded?: boolean;
  /** 제목 글자 크기를 바꿀 때(홈 화면 패널은 text-screen-title) */
  titleClassName?: string;
  className?: string;
}

/** 지도를 가리지 않으면서 내용을 담는 하단 패널. 손잡이를 눌러 접고(제목만) 편다. */
export default function BottomSheet({
  title,
  children,
  footer,
  defaultExpanded = true,
  titleClassName,
  className,
}: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <section
      aria-label={title}
      className={cn(
        'flex w-full flex-col gap-3 rounded-t-xl bg-surface px-5 pt-2 pb-5 shadow-sheet',
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={isExpanded ? '패널 접기' : '패널 펼치기'}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="-mx-5 -mt-2 flex h-6 items-center justify-center pt-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <span className="h-1 w-10 rounded-[2px] bg-map-wall" />
      </button>
      <h2 className={cn('text-heading text-ink', titleClassName)}>{title}</h2>
      <div id={contentId} hidden={!isExpanded} className="flex flex-col gap-3">
        {children}
        {footer && <div className="pt-1 [&>*]:w-full">{footer}</div>}
      </div>
    </section>
  );
}
