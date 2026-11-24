import type { ButtonHTMLAttributes } from 'react';

import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  /** 화면 낭독용 이름(필수). 예: '뒤로', '닫기' */
  label: string;
};

/** 뒤로·닫기처럼 누구나 아는 행동만 아이콘으로 둔다. 48×48px. */
export default function IconButton({
  icon,
  label,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex size-tap-min items-center justify-center rounded-md border border-line',
        'bg-surface text-ink transition-colors active:bg-surface-sunken',
        'disabled:cursor-not-allowed disabled:bg-bg disabled:text-disabled-ink',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={24} />
    </button>
  );
}
