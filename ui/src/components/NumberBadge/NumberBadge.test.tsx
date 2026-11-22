import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NumberBadge from './NumberBadge';

describe('NumberBadge', () => {
  it('화면 낭독기에는 종류 이름과 번호를 함께 읽힌다', () => {
    render(<NumberBadge kind="platform" number={5} />);

    expect(screen.getByText('타는 곳 5')).toHaveClass('sr-only');
  });
});
