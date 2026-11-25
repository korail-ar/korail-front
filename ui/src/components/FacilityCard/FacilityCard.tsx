import Button from '@/components/Button/Button';
import Icon, { type IconName } from '@/components/Icon/Icon';
import Tag from '@/components/Tag/Tag';
import cn from '@/lib/cn';

export interface FacilityInfoRow {
  id: string;
  icon: IconName;
  text: string;
}

interface FacilityCardProps {
  icon: IconName;
  name: string;
  floor: string;
  /** 정보 줄(최대 3줄). 예: 위치 설명, 안내 시작 위치에서 걸리는 시간 */
  rows: readonly FacilityInfoRow[];
  /** 현장 확인 전 정보면 '정보 확인 필요' 태그를 붙인다. */
  needsCheck?: boolean;
  actionLabel?: string;
  /** 주요 버튼 아이콘. 기본은 pin, null이면 아이콘 없이 글자만 둔다. */
  actionIcon?: IconName | null;
  /** false면 주요 버튼 없이 정보만 보여준다(W10 도착 화면). */
  showAction?: boolean;
  onAction?: () => void;
  className?: string;
}

const MAX_ROWS = 3;

/** 시설을 눌렀을 때 보여주는 정보 카드. */
export default function FacilityCard({
  icon,
  name,
  floor,
  rows,
  needsCheck = false,
  actionLabel = '여기로 안내',
  actionIcon = 'pin',
  showAction = true,
  onAction,
  className,
}: FacilityCardProps) {
  return (
    <section
      aria-label={name}
      className={cn('flex flex-col gap-3 rounded-lg border border-line bg-surface p-4', className)}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-press">
          <Icon name={icon} size={24} />
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-heading text-ink">{name}</h3>
          <Tag label={floor} />
          {needsCheck && <Tag label="정보 확인 필요" variant="warn" />}
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.slice(0, MAX_ROWS).map((row) => (
          <li key={row.id} className="flex items-center gap-2 text-body text-ink-sub">
            <Icon name={row.icon} size={16} />
            {row.text}
          </li>
        ))}
      </ul>
      {showAction && (
        <Button icon={actionIcon ?? undefined} fullWidth onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  );
}
