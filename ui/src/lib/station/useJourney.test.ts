import { describe, expect, it } from 'vitest';

import { buildHref, getStepIndex } from './useJourney';

describe('buildHref', () => {
  const current = new URLSearchParams('start=west-gate&to=32&platform=5&q=매');

  it('기본으로 출발 위치만 이어 간다', () => {
    expect(buildHref('/search', current)).toBe('/search?start=west-gate');
  });

  it('지정한 항목을 이어 가고 덮어쓴다', () => {
    expect(buildHref('/guide', current, { step: 2 }, ['start', 'to', 'platform'])).toBe(
      '/guide?start=west-gate&to=32&platform=5&step=2',
    );
  });

  it('빈 값은 지우고, 기본 출발 위치는 주소에 적지 않는다', () => {
    expect(buildHref('/search', current, { start: 'concourse', q: '' }, ['start', 'q'])).toBe(
      '/search',
    );
  });
});

describe('getStepIndex', () => {
  it('범위를 벗어나거나 숫자가 아니면 맞춘다', () => {
    expect(getStepIndex(null, 3)).toBe(0);
    expect(getStepIndex('-1', 3)).toBe(0);
    expect(getStepIndex('abc', 3)).toBe(0);
    expect(getStepIndex('9', 3)).toBe(2);
    expect(getStepIndex('1', 3)).toBe(1);
  });
});
