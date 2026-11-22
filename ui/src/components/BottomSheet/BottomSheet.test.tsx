import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import BottomSheet from './BottomSheet';

describe('BottomSheet', () => {
  it('손잡이를 누르면 내용을 접고 다시 편다', async () => {
    render(
      <BottomSheet title="자주 찾는 곳">
        <p>내용</p>
      </BottomSheet>,
    );

    expect(screen.getByText('내용')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: '패널 접기' }));

    expect(screen.getByText('내용')).not.toBeVisible();
    expect(screen.getByRole('heading', { name: '자주 찾는 곳' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: '패널 펼치기' }));

    expect(screen.getByText('내용')).toBeVisible();
  });
});
