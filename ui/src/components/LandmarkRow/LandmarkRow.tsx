import cn from '@/lib/cn';

interface LandmarkRowProps {
  /** 확인 순서(1부터) */
  number: number;
  title: string;
  /** 눈에 보이는 표지. 예: '매장을 오른쪽에 두고 이동' */
  description?: string;
  className?: string;
}

/**
 * 번호가 붙은 확인 지점 한 줄(Figma Journey B / Landmark row · 295:2167). <ol> 안에 둔다.
 * 실시간 위치가 아니라 "이 지점들만 확인하세요"처럼 미리 보여주는 목록이라 상태(완료·현재)는 없다.
 * 진행 상태가 필요한 단계 목록은 StepItem을 쓴다.
 */
export default function LandmarkRow({ number, title, description, className }: LandmarkRowProps) {
  return (
    <li className={cn('flex min-h-13 items-center gap-3.5 py-2', className)}>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-bold text-brand"
      >
        {number}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="sr-only">{`${number}번째 지점: `}</span>
        <span className="text-body font-bold text-ink">{title}</span>
        {description && <span className="text-note text-ink-mute">{description}</span>}
      </span>
    </li>
  );
}
