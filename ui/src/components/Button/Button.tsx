import type { ButtonHTMLAttributes } from 'react';

import Icon, { type IconName } from '@/components/Icon/Icon';
import cn from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: IconName;
  fullWidth?: boolean;
};

// Figma Button(82:150): Pressed 상태는 :active로, Disabled는 disabled 속성으로 표현한다.
const VARIANT_CLASS_NAMES: Record<ButtonVariant, string> = {
  primary: cn(
    'min-h-13 bg-brand px-5 text-on-color',
    'hover:bg-brand-hover active:bg-brand-press',
    'disabled:bg-disabled-bg disabled:text-disabled-ink',
  ),
  secondary: cn(
    'min-h-13 border-[1.5px] border-brand bg-surface px-5 text-brand-press',
    'active:bg-brand-tint',
    'disabled:border-transparent disabled:bg-disabled-bg disabled:text-disabled-ink',
  ),
  text: cn(
    'min-h-tap-min bg-transparent px-3 text-brand-press',
    'active:bg-brand-tint',
    'disabled:bg-transparent disabled:text-disabled-ink',
  ),
};

/**
 * 버튼 모양 클래스. 다른 화면으로 가는 동작은 <a>(next/link)여야 하므로 링크에도 같은 모양을 입힐 때 쓴다.
 */
export function buttonClassNames(variant: ButtonVariant = 'primary', fullWidth = false): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md text-button whitespace-nowrap',
    'transition-colors disabled:cursor-not-allowed',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
    VARIANT_CLASS_NAMES[variant],
    fullWidth && 'w-full',
  );
}

/** 다음 행동을 실행하는 버튼. Primary는 한 화면에 하나만, 하단에 둔다. */
export default function Button({
  variant = 'primary',
  icon,
  fullWidth = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      className={cn(buttonClassNames(variant, fullWidth), className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}
