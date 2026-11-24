import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

interface StepBarProps {
  icon: IconName;
  text: string;
  /** 눈에 보이는 표지 · 거리. 예: '매장 B가 왼쪽에 보여요 · 약 30m' */
  sub?: string;
  className?: string;
}

/** 지도 위쪽에 띄우는 현재 단계 안내. 단계가 바뀌면 화면 낭독기가 읽도록 status로 둔다. */
export default function StepBar({ icon, text, sub, className }: StepBarProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-lg bg-brand-press px-4 py-3 text-on-color shadow-float',
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-on-color text-brand-press">
        <Icon name={icon} size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-heading">{text}</span>
        {sub && <span className="text-caption">{sub}</span>}
      </span>
    </div>
  );
}
