import { describe, expect, it } from 'vitest';

import cn from './cn';

describe('cn', () => {
  it('글자 크기 토큰과 글자 색 토큰을 둘 다 남긴다', () => {
    expect(cn('text-button', 'text-on-color')).toBe('text-button text-on-color');
  });

  it('같은 그룹이면 뒤에 온 것을 남긴다', () => {
    expect(cn('text-body', 'text-caption')).toBe('text-caption');
    expect(cn('bg-brand', 'bg-brand-press')).toBe('bg-brand-press');
    expect(cn('shadow-float', 'shadow-sheet')).toBe('shadow-sheet');
  });
});
