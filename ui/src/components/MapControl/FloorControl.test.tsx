import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import FloorControl from './FloorControl';

const FLOORS = ['4F', '3F', '2F', '1F'];

describe('FloorControl', () => {
  it('선택된 층만 눌린 상태다', () => {
    render(<FloorControl floors={FLOORS} value="3F" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '3F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4F' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('층을 누르면 그 층으로 onChange를 호출한다', async () => {
    const handleChange = vi.fn();
    render(<FloorControl floors={FLOORS} value="3F" onChange={handleChange} />);

    await userEvent.click(screen.getByRole('button', { name: '1F' }));

    expect(handleChange).toHaveBeenCalledWith('1F');
  });
});
