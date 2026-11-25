import cn from '@/lib/cn';

export interface Milestone {
  id: string;
  label: string;
  /** 출발 · 경유 · 도착 */
  role: string;
}

interface JourneyMilestonesProps {
  milestones: readonly Milestone[];
  /** 지금 있는 지점의 순서(0 = 출발). 경로 미리보기에서는 0. */
  current: number;
  className?: string;
}

// 칸 사이 간격(gap-5.5 = 22px). 선 양끝을 첫·마지막 점 가운데에 맞출 때 쓴다.
const COLUMN_GAP_PX = 22;

function dotClassName(index: number, current: number): string {
  // 출발은 늘 노랑, 지나왔거나 지금인 지점은 파랑, 아직 안 간 지점은 연한 파랑.
  if (index === 0) {
    return 'bg-route-start';
  }
  return index <= current ? 'bg-route-end' : 'bg-milestone-upcoming';
}

/**
 * QR 출발 → 랜드마크 통과 → 목적지 확인(Figma Route/Journey milestones).
 * 실시간 위치 추적이 아닌 단계 안내이므로, 사용자가 넘긴 단계까지만 채운다.
 */
export default function JourneyMilestones({
  milestones,
  current,
  className,
}: JourneyMilestonesProps) {
  const count = milestones.length;
  const lineInset = `calc((100% - ${(count - 1) * COLUMN_GAP_PX}px) / ${count * 2})`;

  return (
    <div className={cn('relative', className)}>
      {/* 첫 점 가운데부터 마지막 점 가운데까지 잇는 선 */}
      <span
        aria-hidden
        className="absolute top-[13px] h-[3px] bg-milestone-upcoming"
        style={{ left: lineInset, right: lineInset }}
      />
      <ol
        aria-label="출발부터 도착까지"
        className="relative grid auto-cols-fr grid-flow-col gap-5.5"
      >
        {milestones.map((milestone, index) => (
          <li
            key={milestone.id}
            aria-current={index === current ? 'step' : undefined}
            className="flex min-w-0 flex-col items-center gap-2 text-center"
          >
            <span
              aria-hidden
              className={cn(
                'size-7 rounded-full border-3 border-on-color',
                dotClassName(index, current),
              )}
            />
            <span className="w-full truncate text-map-label text-ink">{milestone.label}</span>
            <span className="-mt-1.5 text-[10px] leading-[1.5] text-ink-mute">
              {milestone.role}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
