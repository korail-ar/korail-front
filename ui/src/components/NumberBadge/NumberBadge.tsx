import cn from '@/lib/cn';

export type NumberBadgeKind = 'exit' | 'platform' | 'car';

interface NumberBadgeProps {
  kind: NumberBadgeKind;
  number: string | number;
  className?: string;
}

const KIND_LABELS: Record<NumberBadgeKind, string> = {
  exit: '출입구',
  platform: '타는 곳',
  car: '호차',
};

// 출입구는 검은 네모, 타는 곳은 파란 원, 호차는 열차 칸 모양(아래 테두리가 두껍다).
const MARK_CLASS_NAMES: Record<NumberBadgeKind, string> = {
  exit: 'rounded-xs bg-ink text-on-color',
  platform: 'rounded-full bg-brand text-on-color',
  car: 'rounded-xs border-2 border-b-[5px] border-ink bg-surface text-ink',
};

/** 출입구·타는 곳·호차 번호. 숫자만 따로 쓰지 않고 항상 종류 이름을 붙인다. */
export default function NumberBadge({ kind, number, className }: NumberBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-label text-ink', className)}>
      <span
        aria-hidden
        className={cn('flex size-7 shrink-0 items-center justify-center', MARK_CLASS_NAMES[kind])}
      >
        {number}
      </span>
      <span className="sr-only">{`${KIND_LABELS[kind]} ${number}`}</span>
      <span aria-hidden>{KIND_LABELS[kind]}</span>
    </span>
  );
}
