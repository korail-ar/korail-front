import type { ButtonHTMLAttributes } from 'react';

import cn from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS_NAMES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong',
  secondary: 'border border-line bg-background text-foreground hover:bg-surface',
};

export default function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- 기본값 'button'을 두고 호출부에서 바꿀 수 있게 한다.
      type={type}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        VARIANT_CLASS_NAMES[variant],
        className,
      )}
      {...rest}
    />
  );
}
