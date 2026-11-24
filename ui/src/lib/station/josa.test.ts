import { describe, expect, it } from 'vitest';

import withJosa from './josa';

describe('withJosa', () => {
  it('받침에 따라 으로/로를 고른다', () => {
    expect(withJosa('매표소', '으로')).toBe('매표소로');
    expect(withJosa('플라잉스콘', '으로')).toBe('플라잉스콘으로');
    // ㄹ 받침 뒤에는 '로'
    expect(withJosa('3층 맞이방 홀', '으로')).toBe('3층 맞이방 홀로');
  });

  it('괄호와 숫자로 끝나도 읽는 소리로 판단한다', () => {
    expect(withJosa('매표소(매표실)', '으로')).toBe('매표소(매표실)로');
    expect(withJosa('(임시) 매장 1', '으로')).toBe('(임시) 매장 1로');
    expect(withJosa('출구 3', '이')).toBe('출구 3이');
    expect(withJosa('출구 2', '이')).toBe('출구 2가');
  });

  it('을/를, 은/는을 고른다', () => {
    expect(withJosa('매장', '을')).toBe('매장을');
    expect(withJosa('약국', '은')).toBe('약국은');
    expect(withJosa('화장실', '을')).toBe('화장실을');
    expect(withJosa('카페', '은')).toBe('카페는');
  });
});
