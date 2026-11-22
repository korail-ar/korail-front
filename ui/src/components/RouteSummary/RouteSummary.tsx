import Button from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import Tag from '@/components/Tag/Tag';
import cn from '@/lib/cn';

interface RouteSummaryProps {
  /** 출발 = QR이 설치된 자리 이름("현재 위치" 아님) */
  from: string;
  to: string;
  /** 시간·거리에는 항상 "약"을 붙인다. 예: '약 2분', '약 120m · 같은 층' */
  time: string;
  distance: string;
  stepCount: number;
  floor: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** 경로 확정 전 출발·도착과 걸리는 시간 요약. */
export default function RouteSummary({
  from,
  to,
  time,
  distance,
  stepCount,
  floor,
  actionLabel = '안내 시작',
  onAction,
  className,
}: RouteSummaryProps) {
  return (
    <section
      aria-label="경로 요약"
      className={cn('flex flex-col gap-3 rounded-lg border border-line bg-surface p-4', className)}
    >
      <dl className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
            <span className="size-3.5 rounded-[4px] bg-start" />
          </span>
          <div className="flex flex-col">
            <dt className="text-caption text-ink-mute">안내 시작 위치 (QR)</dt>
            <dd className="text-label text-ink">{from}</dd>
          </div>
        </div>
        <span aria-hidden className="flex h-2.5 w-6 justify-center">
          <span className="h-2.5 w-0.5 bg-marker-line" />
        </span>
        <div className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center text-brand-press">
            <Icon name="pin" size={18} />
          </span>
          <div className="flex flex-col">
            <dt className="text-caption text-ink-mute">목적지</dt>
            <dd className="text-label text-ink">{to}</dd>
          </div>
        </div>
      </dl>
      <p className="flex items-baseline gap-2">
        <span className="text-title text-ink">{time}</span>
        <span className="text-caption text-ink-mute">{distance}</span>
      </p>
      <div className="flex items-center gap-2">
        <Tag label={`${stepCount}단계`} variant="info" />
        <Tag label={floor} />
      </div>
      <Button fullWidth onClick={onAction}>
        {actionLabel}
      </Button>
    </section>
  );
}
