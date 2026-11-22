import Icon from '@/components/Icon/Icon';

import MapControlButton from './MapControlButton';
import MapControlGroup from './MapControlGroup';

interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  className?: string;
}

/** 지도 확대·축소. */
export default function ZoomControl({
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  className,
}: ZoomControlProps) {
  return (
    <MapControlGroup label="지도 확대·축소" className={className}>
      <MapControlButton aria-label="확대" onClick={onZoomIn} disabled={!canZoomIn}>
        <Icon name="plus" size={24} />
      </MapControlButton>
      <MapControlButton aria-label="축소" onClick={onZoomOut} disabled={!canZoomOut}>
        <Icon name="minus" size={24} />
      </MapControlButton>
    </MapControlGroup>
  );
}
