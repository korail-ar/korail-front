import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SearchField from './SearchField';

describe('SearchField', () => {
  it('기본 이름은 "목적지 검색"이다', () => {
    render(<SearchField />);

    expect(screen.getByRole('searchbox', { name: '목적지 검색' })).toBeInTheDocument();
  });

  it('값이 없으면 지우기 버튼을 보여주지 않는다', () => {
    render(<SearchField value="" onChange={vi.fn()} onClear={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
  });

  it('지우기 버튼을 누르면 onClear를 호출하고 입력창에 포커스를 돌려준다', async () => {
    const handleClear = vi.fn();
    render(<SearchField value="화장실" onChange={vi.fn()} onClear={handleClear} />);

    await userEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));

    expect(handleClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});
