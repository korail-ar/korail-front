const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const JONG_COUNT = 28;
const JONG_RIEUL = 8;

// 숫자를 한국어로 읽을 때 받침: 0(영)·1(일)·3(삼)·6(육)·7(칠)·8(팔)은 받침이 있다. 1·7·8은 ㄹ 받침.
const DIGIT_JONG: Record<string, number> = {
  0: 21,
  1: JONG_RIEUL,
  2: 0,
  3: 16,
  4: 0,
  5: 0,
  6: 1,
  7: JONG_RIEUL,
  8: JONG_RIEUL,
  9: 0,
};

/** 마지막 글자의 받침 번호(0 = 없음). 괄호·기호는 건너뛰고, 영문 등은 받침 없음으로 본다. */
function lastJong(word: string): number {
  const chars = [...word].reverse();
  const last = chars.find((char) => /[가-힣0-9a-zA-Z]/.test(char));
  if (!last) {
    return 0;
  }
  if (last in DIGIT_JONG) {
    return DIGIT_JONG[last];
  }
  const code = last.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) {
    return 0;
  }
  return (code - HANGUL_START) % JONG_COUNT;
}

export type Josa = '으로' | '을' | '이' | '은';

const JOSA_PAIRS: Record<Josa, [withJong: string, withoutJong: string]> = {
  으로: ['으로', '로'],
  을: ['을', '를'],
  이: ['이', '가'],
  은: ['은', '는'],
};

/** 단어 뒤에 받침에 맞는 조사를 붙인다. 예: withJosa('매표소', '으로') → '매표소로' */
export default function withJosa(word: string, josa: Josa): string {
  const jong = lastJong(word);
  const [withJong, withoutJong] = JOSA_PAIRS[josa];
  // '으로'는 ㄹ 받침 뒤에서도 '로'를 쓴다(예: 출구 → 출구로, 홀 → 홀로).
  const hasJong = josa === '으로' ? jong !== 0 && jong !== JONG_RIEUL : jong !== 0;
  return `${word}${hasJong ? withJong : withoutJong}`;
}
