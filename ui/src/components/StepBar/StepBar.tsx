import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

export type StepBarVariant = 'default' | 'floating';

interface StepBarProps {
  /** 방향 아이콘. floating에서는 생략할 수 있다(C안 구간 안내). */
  icon?: IconName;
  text: string;
  /** 눈에 보이는 표지 · 거리. 예: '매장 B가 왼쪽에 보여요 · 약 30m' */
  sub?: string;
  /**
   * default: 진한 파랑 · 흰 원 안 아이콘(W07).
   * floating: 지도 위에 띄우는 브랜드 파랑 카드(경로 안내 B·C안 "이번에 할 행동 · 구간 안내").
   */
  variant?: StepBarVariant;
  className?: string;
}

/** 지도 위쪽에 띄우는 현재 단계 안내. 단계가 바뀌면 화면 낭독기가 읽도록 status로 둔다. */
export default function StepBar({ icon, text, sub, variant = 'default', className }: StepBarProps) {
  if (variant === 'floating') {
    return (
      <div
        role="status"
        className={cn(
          'flex items-start gap-3 rounded-lg bg-brand px-4 py-3.5 text-on-color',
          className,
        )}
      >
        {icon && <Icon name={icon} size={28} />}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-body-lg">{text}</span>
          {sub && <span className="text-note">{sub}</span>}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-lg bg-brand-press px-4 py-3 text-on-color shadow-float',
        className,
      )}
    >
      {icon && (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-on-color text-brand-press">
          <Icon name={icon} size={24} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-heading">{text}</span>
        {sub && <span className="text-caption">{sub}</span>}
      </span>
    </div>
  );
}
