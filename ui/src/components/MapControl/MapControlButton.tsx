import type { ButtonHTMLAttributes } from 'react';

import cn from '@/lib/cn';

type MapControlButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** 지도 컨트롤 안의 48×48px 버튼 한 칸. */
export default function MapControlButton({
  type = 'button',
  className,
  ...rest
}: MapControlButtonProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      className={cn(
        'flex size-tap-min items-center justify-center text-label text-ink transition-colors',
        'active:bg-surface-sunken disabled:cursor-not-allowed disabled:text-disabled-ink',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...rest}
    />
  );
}
