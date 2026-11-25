import type { ReactNode } from 'react';

import cn from '@/lib/cn';

interface GuidanceSheetProps {
  /** 제목 위 보조 문구. 예: '다음 확인 지점', '맞이방 QR → 매표소' */
  eyebrow?: string;
  title: string;
  /** 제목 아래 설명. 줄바꿈(\n)을 그대로 보여준다. */
  description?: string;
  /** 사진 · 랜드마크 목록 · 여정 표시 등 패널 내용 */
  children?: ReactNode;
  /** 주요 버튼(Button 또는 버튼 모양 링크). 가로를 꽉 채운다. */
  primaryAction?: ReactNode;
  /** 주요 버튼 아래 글자 링크. 예: '전체 이동 순서 보기', '이전 지점으로' */
  secondaryAction?: ReactNode;
  /** 맨 아래 작은 안내문. 예: '사진과 다르면 가까운 QR에서 위치 다시 확인' */
  note?: string;
  /** 위쪽 손잡이 모양(B안 패널). 끌어서 여닫지는 않는 표시다. */
  showHandle?: boolean;
  className?: string;
}

/**
 * 경로 안내 하단 패널(Figma 295:3362 · 295:3751 · 300:4854 · 303:5574).
 * 보조 문구 → 제목 → 설명 → 내용 → 주요 버튼 → 글자 링크/안내문 순서가 B안·C안 패널에 공통이다.
 * 접고 펴는 패널이 필요하면 BottomSheet를 쓴다.
 */
export default function GuidanceSheet({
  eyebrow,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  note,
  showHandle = false,
  className,
}: GuidanceSheetProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex flex-col gap-2.5 rounded-t-xl border border-b-0 border-line bg-surface px-5 pb-6',
        showHandle ? 'pt-2.5' : 'pt-4.5',
        className,
      )}
    >
      {showHandle && (
        <span aria-hidden className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-[2px] bg-line" />
      )}
      {eyebrow && <p className="text-note text-ink-mute">{eyebrow}</p>}
      <h2 className="text-headline text-ink">{title}</h2>
      {description && <p className="text-note whitespace-pre-line text-ink-mute">{description}</p>}
      {children}
      {primaryAction && <div className="flex flex-col [&>*]:w-full">{primaryAction}</div>}
      {secondaryAction && <div className="flex justify-center">{secondaryAction}</div>}
      {note && <p className="text-micro text-ink-mute">{note}</p>}
    </section>
  );
}

/** GuidanceSheet 아래 글자 링크 모양(13px 굵게 · 브랜드 파랑). 링크·버튼 어디에나 입힌다. */
export const GUIDANCE_SHEET_LINK_CLASS_NAMES = cn(
  'inline-flex min-h-6 items-center justify-center rounded-xs px-2 text-caption font-bold text-brand',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
);
