import cn from '@/lib/cn';

export type MapLabelVariant = 'facility' | 'strong' | 'start';

interface MapLabelProps {
  label: string;
  variant?: MapLabelVariant;
  className?: string;
}

const VARIANT_CLASS_NAMES: Record<MapLabelVariant, string> = {
  facility: 'bg-surface text-ink-sub',
  strong: 'bg-ink text-on-color',
  start: 'bg-start text-on-color',
};

/**
 * 마커 아래(목적지는 위)에 붙는 이름.
 * 목적지·안내 시작 위치는 항상 표시하고, 시설은 확대했을 때만 표시한다.
 */
export default function MapLabel({ label, variant = 'facility', className }: MapLabelProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xs px-2 py-0.5 text-map-label whitespace-nowrap',
        VARIANT_CLASS_NAMES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
