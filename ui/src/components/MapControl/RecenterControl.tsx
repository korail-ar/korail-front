import Icon from '@/components/Icon/Icon';

import MapControlButton from './MapControlButton';
import MapControlGroup from './MapControlGroup';

interface RecenterControlProps {
  onRecenter: () => void;
  className?: string;
}

/**
 * 지도를 안내 시작 위치(또는 경로 전체)가 보이는 처음 상태로 되돌린다.
 * GPS를 쓰지 않으므로 "내 위치로 이동"이 아니다.
 */
export default function RecenterControl({ onRecenter, className }: RecenterControlProps) {
  return (
    <MapControlGroup label="지도 위치" className={className}>
      <MapControlButton aria-label="처음 위치로 지도 되돌리기" onClick={onRecenter}>
        <Icon name="recenter" size={24} />
      </MapControlButton>
    </MapControlGroup>
  );
}
