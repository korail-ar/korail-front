import cn from '@/lib/cn';

export type MapBadgeTone = 'strong' | 'muted';

interface MapBadgeProps {
  label: string;
  /** strong: 층 표시("3F · 맞이방", 진한 글자) · muted: 확인 지점 이름("QR로 확인한 출발점", 회색 글자) */
  tone?: MapBadgeTone;
  className?: string;
}

const TONE_CLASS_NAMES: Record<MapBadgeTone, string> = {
  strong: 'text-ink',
  muted: 'text-ink-mute',
};

/**
 * 지도 위 흰 바탕 작은 이름표(Figma 295:2923 "3F · 맞이방" · 303:5564 "확인 위치 라벨").
 * 시설·출발·도착 이름은 MapLabel을 쓴다.
 */
export default function MapBadge({ label, tone = 'strong', className }: MapBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-surface px-2.5 py-1.25 text-micro font-bold whitespace-nowrap',
        TONE_CLASS_NAMES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
