import Image from 'next/image';

import cn from '@/lib/cn';

interface LandmarkPhotoProps {
  /** 현장 사진. 시설마다 바뀌는 데이터라 주소로 받는다(Figma "현장 사진 · 교체 가능"). */
  src: string;
  /** 사진에 보이는 것. 예: 'FLYING SCONE 간판이 보이는 3층 맞이방' */
  alt: string;
  className?: string;
}

/**
 * 경로 안내 패널의 큰 현장 사진(Figma Journey B / Landmark photo · 300:4440, 335×150).
 * 사용자가 간판과 비교할 수 있게 사진 전체 폭을 쓴다.
 */
export default function LandmarkPhoto({ src, alt, className }: LandmarkPhotoProps) {
  return (
    <div
      className={cn(
        'relative aspect-[67/30] w-full overflow-hidden rounded-lg bg-surface-sunken',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 448px) 100vw, 408px"
        className="object-cover"
      />
    </div>
  );
}
