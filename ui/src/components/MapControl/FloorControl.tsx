import cn from '@/lib/cn';

import MapControlButton from './MapControlButton';
import MapControlGroup from './MapControlGroup';

interface FloorControlProps {
  /** 위층부터 순서대로. 예: ['4F', '3F', '2F', '1F'] */
  floors: readonly string[];
  value: string;
  onChange: (floor: string) => void;
  className?: string;
}

/** 층 선택. 안내 범위가 여러 층일 때만 표시한다. */
export default function FloorControl({ floors, value, onChange, className }: FloorControlProps) {
  return (
    <MapControlGroup label="층 선택" className={className}>
      {floors.map((floor) => {
        const isSelected = floor === value;
        return (
          <MapControlButton
            key={floor}
            aria-pressed={isSelected}
            onClick={() => onChange(floor)}
            className={cn(isSelected && 'bg-brand text-on-color active:bg-brand-press')}
          >
            {floor}
          </MapControlButton>
        );
      })}
    </MapControlGroup>
  );
}
