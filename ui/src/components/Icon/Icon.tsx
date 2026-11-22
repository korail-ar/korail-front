import type { CSSProperties } from 'react';

import cn from '@/lib/cn';

export const ICON_NAMES = [
  'search',
  'plus',
  'minus',
  'close',
  'check',
  'chev-right',
  'chev-left',
  'arrow-up',
  'turn-right',
  'turn-left',
  'recenter',
  'alert',
  'info',
  'refresh',
  'qr',
  'toilet',
  'locker',
  'water',
  'shop',
  'ticket',
  'train',
  'car',
  'bus',
  'stairs',
  'elevator',
  'pin',
  'walk',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

// Figma에서 쓰는 아이콘 크기(px). 16/20/24는 토큰(icon-sm/md/lg), 나머지는 컴포넌트 안에서만 쓰는 크기.
export type IconSize = 14 | 16 | 18 | 20 | 24 | 28;

const SIZE_CLASS_NAMES: Record<IconSize, string> = {
  14: 'size-3.5',
  16: 'size-icon-sm',
  18: 'size-4.5',
  20: 'size-icon-md',
  24: 'size-icon-lg',
  28: 'size-7',
};

interface IconProps {
  name: IconName;
  size?: IconSize;
  /** 아이콘만으로 뜻을 전할 때의 이름. 없으면 장식용으로 보고 화면 낭독기에서 숨긴다. */
  label?: string;
  className?: string;
}

/**
 * public/icons의 SVG(Figma 원본)를 마스크로 써서 currentColor로 칠한다.
 * 같은 아이콘을 상태마다 다른 색으로 쓰기 때문에 <img> 대신 마스크를 쓴다.
 */
export default function Icon({ name, size = 24, label, className }: IconProps) {
  const style: CSSProperties = {
    maskImage: `url(/icons/${name}.svg)`,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat',
  };

  return (
    <span
      className={cn('inline-block shrink-0 bg-current', SIZE_CLASS_NAMES[size], className)}
      style={style}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}
