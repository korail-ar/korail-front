import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

export type TagVariant = 'neutral' | 'info' | 'start' | 'warn';

interface TagProps {
  label: string;
  variant?: TagVariant;
  /** 기본 아이콘을 바꿀 때만 넘긴다. neutral에는 아이콘이 없다. */
  icon?: IconName;
  className?: string;
}

const VARIANT_CLASS_NAMES: Record<TagVariant, string> = {
  neutral: 'bg-bg text-ink-sub',
  info: 'bg-brand-soft text-brand-press',
  start: 'bg-start-soft text-start-ink',
  warn: 'bg-warn-bg text-warn-ink',
};

const DEFAULT_ICONS: Record<TagVariant, IconName | undefined> = {
  neutral: undefined,
  info: 'walk',
  start: 'qr',
  warn: 'alert',
};

/** 짧은 상태·분류 표시. warn은 현장 확인 전 정보에, start는 QR 안내 시작 위치에만 쓴다. */
export default function Tag({ label, variant = 'neutral', icon, className }: TagProps) {
  const iconName = variant === 'neutral' ? undefined : (icon ?? DEFAULT_ICONS[variant]);

  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center justify-center gap-1 rounded-xs px-2 text-map-label whitespace-nowrap',
        VARIANT_CLASS_NAMES[variant],
        className,
      )}
    >
      {iconName && <Icon name={iconName} size={14} />}
      {label}
    </span>
  );
}
