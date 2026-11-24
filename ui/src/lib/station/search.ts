import { STATION } from './data';
import type { StationPlace } from './types';

const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const CHOSEONG_DIVISOR = 588;

/** 띄어쓰기·기호·대소문자 차이를 없앤다. 예: '매표·안내 창구' → '매표안내창구' */
export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s·()[\]\-_.,&/]/g, '');
}

function toChoseong(text: string): string {
  return [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < HANGUL_START || code > HANGUL_END) {
        return char;
      }
      return CHOSEONG[Math.floor((code - HANGUL_START) / CHOSEONG_DIVISOR)];
    })
    .join('');
}

const isChoseongOnly = (text: string) => /^[ㄱ-ㅎ]+$/.test(text);

// 점수가 높을수록 위에 보인다.
const SCORES = {
  exactName: 100,
  exactAlias: 90,
  prefixName: 80,
  prefixAlias: 70,
  containsName: 60,
  containsAlias: 50,
  choseong: 40,
};

function scorePlace(place: StationPlace, query: string): number {
  const name = normalize(place.name);
  const aliases = [place.sourceName, ...place.aliases].map(normalize);

  if (isChoseongOnly(query)) {
    return [name, ...aliases].some((text) => toChoseong(text).includes(query))
      ? SCORES.choseong
      : 0;
  }
  if (name === query) {
    return SCORES.exactName;
  }
  if (aliases.includes(query)) {
    return SCORES.exactAlias;
  }
  if (name.startsWith(query)) {
    return SCORES.prefixName;
  }
  if (aliases.some((alias) => alias.startsWith(query))) {
    return SCORES.prefixAlias;
  }
  if (name.includes(query)) {
    return SCORES.containsName;
  }
  if (aliases.some((alias) => alias.includes(query))) {
    return SCORES.containsAlias;
  }
  return 0;
}

/** 이름·별칭에서 부분 일치로 찾는다. 초성만 입력해도 찾는다(예: 'ㅁㅍ' → 매표소). */
export function searchPlaces(
  rawQuery: string,
  places: readonly StationPlace[] = STATION.places,
): StationPlace[] {
  const query = normalize(rawQuery);
  if (!query) {
    return [];
  }
  return places
    .map((place) => ({ place, score: scorePlace(place, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'ko'))
    .map(({ place }) => place);
}
