import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

export type StepState = 'done' | 'current' | 'next';

interface StepItemProps {
  state: StepState;
  /** 방향 아이콘. done 단계는 항상 체크로 바뀐다. */
  icon: IconName;
  text: string;
  /** current 단계에서만 보이는 보조 설명(눈에 보이는 표지 · 거리) */
  sub?: string;
  className?: string;
}

const ICON_WRAP_CLASS_NAMES: Record<StepState, string> = {
  done: 'bg-bg text-ink-mute',
  current: 'bg-brand text-on-color',
  next: 'bg-brand-soft text-brand-press',
};

/**
 * 단계별 이동 안내의 한 줄(<ol> 안에 둔다).
 * 단계는 저절로 넘어가지 않고 사용자가 "다음 단계"를 눌러 넘긴다.
 */
export default function StepItem({ state, icon, text, sub, className }: StepItemProps) {
  const isCurrent = state === 'current';

  return (
    <li
      aria-current={isCurrent ? 'step' : undefined}
      className={cn('flex items-center gap-3 py-2.5', className)}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          ICON_WRAP_CLASS_NAMES[state],
        )}
      >
        <Icon name={state === 'done' ? 'check' : icon} size={isCurrent ? 24 : 20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {state === 'done' && <span className="sr-only">완료: </span>}
        <span
          className={cn(
            isCurrent ? 'text-body-lg text-ink' : 'text-body',
            state === 'done' && 'text-ink-mute',
            state === 'next' && 'text-ink-sub',
          )}
        >
          {text}
        </span>
        {isCurrent && sub && <span className="text-caption text-ink-mute">{sub}</span>}
      </span>
    </li>
  );
}
