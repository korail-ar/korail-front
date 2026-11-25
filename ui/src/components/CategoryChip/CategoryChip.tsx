import type { ButtonHTMLAttributes } from 'react';

import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

type CategoryChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  label: string;
  selected?: boolean;
};

/** 칩 모양 클래스. 다른 화면으로 가는 칩(홈 화면 바로가기)은 링크에 같은 모양을 입힌다. */
export const CATEGORY_CHIP_CLASS_NAMES = cn(
  'inline-flex min-h-tap-min shrink-0 items-center justify-center gap-2 rounded-full',
  'border-[1.5px] px-4 text-label whitespace-nowrap transition-colors',
  'border-line-strong bg-surface text-ink-sub',
  'aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-color',
  'disabled:cursor-not-allowed disabled:border-line disabled:bg-bg disabled:text-disabled-ink',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
);

/**
 * 시설 분류 버튼. 한 번에 하나만 선택하며 선택되면 아이콘이 체크로 바뀐다.
 * 선택 상태 관리는 부모가 한다(가로 한 줄로 놓는다).
 */
export default function CategoryChip({
  icon,
  label,
  selected = false,
  type = 'button',
  className,
  ...rest
}: CategoryChipProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      aria-pressed={selected}
      className={cn(CATEGORY_CHIP_CLASS_NAMES, className)}
      {...rest}
    >
      <Icon name={selected ? 'check' : icon} size={18} />
      {label}
    </button>
  );
}
