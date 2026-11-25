import cn from '@/lib/cn';

export type RouteEndpointType = 'start' | 'end';

interface RouteEndpointProps {
  type: RouteEndpointType;
  className?: string;
}

const FILL_CLASS_NAMES: Record<RouteEndpointType, string> = {
  start: 'bg-route-start',
  end: 'bg-route-end',
};

/**
 * 경로의 출발·도착 원형 지점(Figma Route/Endpoint, 24px 흰 테두리 안 16px 점).
 * 출발은 노란색, 도착은 파란색. 이름은 지도 레이어에서 MapLabel로 붙인다.
 */
export default function RouteEndpoint({ type, className }: RouteEndpointProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-icon-lg items-center justify-center rounded-full bg-surface',
        className,
      )}
    >
      <span className={cn('size-icon-sm rounded-full', FILL_CLASS_NAMES[type])} />
    </span>
  );
}
