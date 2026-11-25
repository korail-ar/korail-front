export const placeCategories = [
  { id: 'all', label: '전체', icon: '⌕', color: '#315a82' },
  { id: 'restroom', label: '화장실', icon: '🚻', color: '#315fb5' },
  { id: 'food', label: '식당·카페', icon: '🍴', color: '#c05b28' },
  { id: 'information', label: '안내·편의', icon: 'ⓘ', color: '#20877b' },
  { id: 'elevator', label: '엘리베이터', icon: '↕', color: '#694eb1' },
  { id: 'transit', label: '출입·승강장', icon: '🚉', color: '#496b8c' },
  { id: 'ticketing', label: '매표·발권', icon: '🎫', color: '#b05d7f' },
  { id: 'shop', label: '매장', icon: '▣', color: '#6e7581' }
];

const foodNames = /플라잉스콘|신청도할매김밥|복순도가|카페스토리웨이|와플샵|코브라독스|삼진어묵|에그박스/;

export function categoryForPlace(place) {
  if (place.category === 'restroom') return 'restroom';
  if (place.category === 'shop') return foodNames.test(place.name) ? 'food' : 'shop';
  if (place.category === 'facility') return 'information';
  if (place.category === 'elevator') return 'elevator';
  if (place.category === 'ticketing') return 'ticketing';
  return 'transit';
}
