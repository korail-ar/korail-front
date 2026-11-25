import Link from 'next/link';

import Icon from '@/components/Icon/Icon';
import cn from '@/lib/cn';

import { searchFieldBoxClassNames } from './SearchField';

interface SearchFieldLinkProps {
  href: string;
  placeholder?: string;
  floating?: boolean;
  className?: string;
}

/**
 * 검색 화면을 여는 검색창 모양 링크(W01 홈 패널). 홈에서는 입력하지 않고 검색 화면으로 넘어가므로
 * 입력창 대신 링크로 두되, SearchField와 같은 상자 모양을 쓴다.
 */
export default function SearchFieldLink({
  href,
  placeholder = '어디로 가시나요?',
  floating = false,
  className,
}: SearchFieldLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        searchFieldBoxClassNames(floating),
        'text-body text-ink-mute transition-colors active:bg-surface-sunken',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
    >
      <Icon name="search" size={20} />
      <span className="truncate">{placeholder}</span>
    </Link>
  );
}
