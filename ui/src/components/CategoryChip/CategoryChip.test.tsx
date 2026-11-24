import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CategoryChip from './CategoryChip';

describe('CategoryChip', () => {
  it('선택 상태를 aria-pressed로 알린다', () => {
    const { rerender } = render(<CategoryChip icon="toilet" label="화장실" />);

    expect(screen.getByRole('button', { name: '화장실' })).toHaveAttribute('aria-pressed', 'false');

    rerender(<CategoryChip icon="toilet" label="화장실" selected />);

    expect(screen.getByRole('button', { name: '화장실' })).toHaveAttribute('aria-pressed', 'true');
  });
});
