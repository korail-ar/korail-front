import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Button from './Button';

describe('Button', () => {
  it('기본 type은 button이다', () => {
    render(<Button>확인</Button>);

    expect(screen.getByRole('button', { name: '확인' })).toHaveAttribute('type', 'button');
  });

  it('클릭하면 onClick을 호출한다', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>확인</Button>);

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('비활성 상태에서는 onClick을 호출하지 않는다', async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        확인
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
