import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

export type MapMarkerType =
  'destination' | 'start' | 'floor' | 'step' | 'facility-selected' | 'facility' | 'facility-dim';

interface MapMarkerProps {
  type: MapMarkerType;
  /** destination·floor·facility(-selected)에 들어가는 아이콘 */
  icon?: IconName;
  /** step 마커의 단계 번호 */
  step?: number;
  className?: string;
}

// 목적지 핀 모양(Figma MapMarker/Destination의 pin 경로를 46×60 상자에 맞춰 옮긴 것).
// 핀 안 아이콘이 목적지 시설마다 바뀌어야 해서 SVG 파일 대신 경로를 직접 그린다.
const DESTINATION_PIN_PATH =
  'M23 57C23 57 3 37 3 23C3 17.6957 5.10714 12.6086 8.85786 8.85786C12.6086 5.10714 17.6957 3 23 3' +
  'C28.3043 3 33.3914 5.10714 37.1421 8.85786C40.8929 12.6086 43 17.6957 43 23C43 37 23 57 23 57Z';

function DestinationMarker({ icon, className }: { icon: IconName; className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-block h-15 w-11.5 drop-shadow-[0_2px_4px_rgb(27_31_39/0.18)]',
        className,
      )}
    >
      <svg width="46" height="60" viewBox="0 0 46 60" className="absolute inset-0" aria-hidden>
        <path
          d={DESTINATION_PIN_PATH}
          className="fill-dest stroke-on-color"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
      <Icon name={icon} size={20} className="absolute top-[13px] left-[13px] text-on-color" />
    </span>
  );
}

/**
 * 지도 위 표시. 우선순위: 목적지 → 안내 시작 위치 → 층간 이동 → 단계 지점 → 선택된 시설 → 시설.
 * 안내 시작 위치(start)는 멈춰 있는 표시다(움직임·방향 화살표 없음).
 * 접근성 이름은 지도 레이어(버튼·목록)에서 붙이므로 마커 자체는 장식으로 둔다.
 */
export default function MapMarker({ type, icon = 'pin', step, className }: MapMarkerProps) {
  switch (type) {
    case 'destination':
      return <DestinationMarker icon={icon} className={className} />;
    case 'start':
      return (
        <span
          aria-hidden
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-[10px] bg-start',
            className,
          )}
        >
          <span className="flex size-8 items-center justify-center rounded-sm border-3 border-on-color bg-start text-on-color">
            <Icon name="qr" size={16} />
          </span>
        </span>
      );
    case 'floor':
      return (
        <span
          aria-hidden
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-sm border-2 border-on-color bg-ink text-on-color',
            className,
          )}
        >
          <Icon name={icon} size={18} />
        </span>
      );
    case 'step':
      return (
        <span
          aria-hidden
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full border-[2.5px] border-brand-press',
            'bg-surface text-map-label text-brand-press',
            className,
          )}
        >
          {step}
        </span>
      );
    case 'facility-selected':
      return (
        <span
          aria-hidden
          className={cn(
            'inline-flex size-11 items-center justify-center rounded-full bg-brand-press',
            className,
          )}
        >
          <span className="flex size-marker-selected items-center justify-center rounded-full border-3 border-on-color bg-brand-press text-on-color">
            <Icon name={icon} size={20} />
          </span>
        </span>
      );
    case 'facility':
      return (
        <span
          aria-hidden
          className={cn(
            'inline-flex size-marker-facility items-center justify-center rounded-full',
            'border-[1.5px] border-marker-line bg-surface text-marker',
            className,
          )}
        >
          <Icon name={icon} size={16} />
        </span>
      );
    case 'facility-dim':
    default:
      return (
        <span
          aria-hidden
          className={cn('inline-block size-2.5 rounded-full bg-marker-line', className)}
        />
      );
  }
}
