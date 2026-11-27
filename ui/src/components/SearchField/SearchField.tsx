'use client';

import { useRef, type InputHTMLAttributes, type Ref } from 'react';

import Icon from '@/components/Icon/Icon';
import cn from '@/lib/cn';

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** 화면 낭독용 이름. 기본값은 '목적지 검색' */
  label?: string;
  /** 지도 위에 띄울 때. 테두리 대신 그림자를 쓴다. */
  floating?: boolean;
  onClear?: () => void;
  inputRef?: Ref<HTMLInputElement>;
};

/** 검색창 상자 모양(입력 전 기본 상태). SearchFieldLink도 같은 모양을 쓴다. */
export function searchFieldBoxClassNames(floating = false): string {
  return cn(
    'group flex h-13 w-full items-center gap-3 rounded-md bg-surface px-4',
    floating ? 'shadow-float' : 'border-[1.5px] border-line-strong',
  );
}

/** 목적지 검색 입력창. 포커스되면 테두리가 파랗게 바뀌고, 값이 있으면 지우기 버튼이 나온다. */
export default function SearchField({
  label = '목적지 검색',
  floating = false,
  placeholder = '어디로 가시나요?',
  value,
  onClear,
  inputRef: externalRef,
  className,
  ...rest
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value !== undefined && value !== '';

  const handleClear = () => {
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        searchFieldBoxClassNames(floating),
        floating
          ? 'focus-within:outline-2 focus-within:outline-brand'
          : 'focus-within:border-2 focus-within:border-brand',
        className,
      )}
    >
      <Icon name="search" size={20} className="text-ink-mute group-focus-within:text-brand-press" />
      <input
        ref={externalRef ?? inputRef}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-mute',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
        {...rest}
      />
      {hasValue && onClear && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={handleClear}
          className="-mr-2 flex size-9 items-center justify-center rounded-full text-ink-sub"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}
