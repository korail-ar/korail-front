import { buildStationRoute } from './multi-floor-route.js';
import { searchPlaces } from './station-route-math.js';
import { buildRouteSteps } from './route-steps.js';
const fields = { from: document.getElementById('fromSearch'), to: document.getElementById('toSearch') };
const results = document.getElementById('searchResults');
const status = document.getElementById('routeStatus');
const stages = document.getElementById('routeStages');
const accessibleInput = document.getElementById('accessibleRoute');
const places = window.daejeonPlaces?.() || [];
const connectionList = document.getElementById('connectionList');
Promise.all([1,2,3,4].map(async floor => {
  const response = await fetch(`/assets/json/floor-${floor}-graph.json`);
  if (!response.ok) throw new Error('graph');
  return response.json();
})).then(graphs => {
  for (const graph of graphs) {
    for (const place of graph.places.filter(item => /계단|승강기|에스컬레이터/.test(item.name) && !/[?？]/.test(item.name)).slice(0, 4)) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'connection-item';
      const name = document.createElement('strong'); name.textContent = place.name;
      const detail = document.createElement('small'); detail.textContent = `${graph.floor}F · 연결 후보`;
      button.append(name, detail);
      button.addEventListener('click', () => window.daejeonFocusPlace?.(place.id));
      connectionList.append(button);
    }
  }
}).catch(() => { connectionList.textContent = '연결점 데이터를 불러오지 못했습니다.'; });
const selected = { from: null, to: null };
let activeField = 'from';
function closeResults() { results.replaceChildren(); results.classList.remove('open'); Object.values(fields).forEach(input => input.setAttribute('aria-expanded', 'false')); }
function choose(place) {
  window.daejeonClearRoute?.(); stages.replaceChildren();
  selected[activeField] = place;
  fields[activeField].value = place.name;
  window.daejeonFocusPlace(place.id);
  status.textContent = `${activeField === 'from' ? '출발지' : '목적지'}: ${place.name}`;
  closeResults();
}
function search(field) {
  activeField = field; const input = fields[field]; const query = input.value.trim();
  selected[field] = null; window.daejeonClearRoute?.(); stages.replaceChildren(); closeResults();
  if (!query) return;
  const matches = searchPlaces(places, query).slice(0, 12);
  if (!matches.length) { const empty = document.createElement('p'); empty.textContent = '검색 결과가 없습니다.'; results.append(empty); }
  for (const place of matches) {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'option');
    const name = document.createElement('span'); name.textContent = place.name;
    const floor = document.createElement('small'); floor.textContent = `${place.floor}F`;
    button.append(name, floor); button.addEventListener('click', () => choose(place)); results.append(button);
  }
  results.classList.add('open'); input.setAttribute('aria-expanded', 'true');
}
for (const [field,input] of Object.entries(fields)) {
  input.addEventListener('input', () => search(field));
  input.addEventListener('focus', () => search(field));
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeResults();
    if (event.key === 'Enter') { const first = results.querySelector('button'); if (first) { event.preventDefault(); first.click(); } }
  });
}
document.addEventListener('pointerdown', event => { if (!event.target.closest('.search-box')) closeResults(); });
document.getElementById('findRoute').addEventListener('click', async () => {
  const from = selected.from, to = selected.to;
  window.daejeonClearRoute?.(); stages.replaceChildren();
  if (!from || !to) { status.textContent = '검색 결과에서 출발지와 목적지를 선택해 주세요.'; return; }
  const floorNumbers = Array.from({ length: Math.abs(to.floor - from.floor) + 1 }, (_, i) => Math.min(from.floor,to.floor) + i);
  try {
    const graphs = new Map(await Promise.all(floorNumbers.map(async floor => {
      const response = await fetch(`/assets/json/floor-${floor}-graph.json`);
      if (!response.ok) throw new Error('graph');
      return [floor, await response.json()];
    })));
    const plan = buildStationRoute(graphs, from, to, accessibleInput.checked);
    if (!plan) { status.textContent = '선택한 시설 사이의 연결 경로를 찾지 못했습니다.'; return; }
    const mode = plan.accessible ? '승강기 후보' : '계단 후보';
    status.textContent = `${from.name} → ${to.name} · ${from.floor === to.floor ? '같은 층 경로' : mode + '를 통한 층간 예시'} · 약 ${Math.max(1,Math.ceil(plan.estimatedTimeSeconds/60))}분 · 도보 추정 ${Math.round(plan.estimatedDistanceM)}m`;
    const buttons = [];
    plan.segments.forEach((segment, index) => {
      const button = document.createElement('button'); button.type='button'; button.className='route-stage';
      const floor = document.createElement('strong'); floor.textContent=`${segment.floor}F`;
      const description = document.createElement('span');
      description.textContent = segment.start.id === segment.end.id ? `${plan.connectorName}에서 다음 층으로 이동` : `${segment.start.name} → ${segment.end.name}`;
      button.append(floor,description);
      button.addEventListener('click', () => {
        buttons.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        window.daejeonDrawRoute?.(segment.floor, segment.graph, segment.route, segment.start, segment.end);
      });
      buttons.push(button); stages.append(button);
      const directions = document.createElement('ol');
      directions.className = 'segment-directions';
      for (const step of buildRouteSteps(segment.graph, { ids: segment.route.nodeIds }, segment.start, segment.end)) {
        const item = document.createElement('li'); item.textContent = step.text; directions.append(item);
      }
      if (directions.children.length) stages.append(directions);
    });
    if (plan.provisionalVerticalConnection) {
      const caveat = document.createElement('p'); caveat.className='route-caveat';
      caveat.textContent = '층간 연결은 도면의 위치를 바탕으로 한 후보 경로입니다. 승강기 운행층과 계단 출입 가능 여부는 현장에서 확인하세요.';
      stages.append(caveat);
    }
    buttons[0]?.click();
  } catch { status.textContent = '경로 데이터를 불러오지 못했습니다.'; }
});
