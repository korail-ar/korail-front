import Icon from '@/components/Icon/Icon';
import cn from '@/lib/cn';

interface CheckpointMarkerProps {
  /**
   * 다음 구간의 진행 방향(도, 위쪽 = 0, 시계 방향). C안은 지도를 진행 방향이 위로 오게 돌리므로 보통 0이다.
   */
  direction?: number;
  className?: string;
}

/**
 * 사용자가 확인한 지점과 다음 구간 방향(Figma 303:5561 · 303:5562, 44px).
 * 자동 위치 추적이 아니라 사용자가 "다음 단계"를 눌러 확인한 지점에 고정한다. 이름표는 MapBadge로 붙인다.
 */
export default function CheckpointMarker({ direction = 0, className }: CheckpointMarkerProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full border-3 border-on-color bg-brand-soft text-ink',
        className,
      )}
    >
      <span className="inline-flex transition-transform" style={{ rotate: `${direction}deg` }}>
        <Icon name="arrow-up" size={24} />
      </span>
    </span>
  );
}
