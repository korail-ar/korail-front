import Image from 'next/image';
import type { ButtonHTMLAttributes } from 'react';

import cn from '@/lib/cn';

type SitePhotoMarkerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** 현장 사진(썸네일) */
  src: string;
  /** 어느 지점의 사진인지. 화면 낭독기에는 "플라잉스콘 현장 사진 보기"로 읽힌다. */
  placeName: string;
};

/**
 * 지도 위에 띄우는 현장 사진 썸네일(Figma Journey B / Map photo marker · 300:4441, 88×76).
 * 누르면 큰 사진 패널(LandmarkPhoto가 든 GuidanceSheet)을 연다. 위치는 지도 레이어에서 정한다.
 */
export default function SitePhotoMarker({
  src,
  placeName,
  type = 'button',
  className,
  ...rest
}: SitePhotoMarkerProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      aria-label={`${placeName} 현장 사진 보기`}
      className={cn(
        'inline-flex w-22 flex-col gap-[3px] rounded-sm border border-line bg-surface p-1',
        'transition-colors active:bg-surface-sunken',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...rest}
    >
      <span className="relative h-12 w-full overflow-hidden rounded-xs">
        <Image src={src} alt="" fill sizes="80px" className="object-cover" />
      </span>
      <span
        aria-hidden
        className="w-full text-center text-[10px] leading-[1.5] font-bold text-brand"
      >
        현장 사진 보기
      </span>
    </button>
  );
}
