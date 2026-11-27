import { describe, expect, it } from 'vitest';

import { normalize, searchPlaces } from './search';

const names = (query: string) => searchPlaces(query).map((place) => place.name);

describe('normalize', () => {
  it('띄어쓰기·기호·대소문자를 없앤다', () => {
    expect(normalize('매표·안내 창구')).toBe('매표안내창구');
    expect(normalize('KR스타트업 라운지(공단)')).toBe('kr스타트업라운지공단');
  });
});

describe('searchPlaces', () => {
  it('빈 검색어는 결과가 없다', () => {
    expect(searchPlaces('   ')).toEqual([]);
  });

  it('이름이 정확히 같으면 맨 위에 둔다', () => {
    expect(names('대전역약국')[0]).toBe('대전역약국');
  });

  it('별칭으로도 찾는다', () => {
    expect(names('약국')).toContain('대전역약국');
    expect(names('지하철')).toContain('서광장・지하철 방향(4번 출구)');
  });

  it('띄어쓰기가 달라도 찾는다', () => {
    expect(names('대전역 약국')).toContain('대전역약국');
  });

  it('초성만 입력해도 찾는다', () => {
    expect(names('ㅁㅍㅅ')).toContain('매표소(매표실)');
  });

  it('지도 이름으로 바꾼 시설은 원래 이름으로도 찾는다', () => {
    expect(names('승강장 연결통로(지도 상단)')).toContain('11–12번 홈');
  });
});
