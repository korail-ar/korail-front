import { fastestRoute } from './assets/json/fastest-route.mjs';
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
let floor = 3, graph, places = [], zoom = 1, selected = { from: null, to: null };
const svg = (tag, attrs) => { const el = document.createElementNS(NS, tag); for (const [key,value] of Object.entries(attrs)) el.setAttribute(key, value); return el; };
function placeNode(place) { return place.nodeId || place.candidateApproachNodeId; }
function setStatus(message) { $('status').textContent = message; }
function clearRoute() { $('routeLayer').replaceChildren(); $('result').hidden = true; }
function drawMarkers() {
  const layer = $('placeLayer'); layer.replaceChildren();
  for (const place of places) {
    if (!Number.isFinite(place.x) || !Number.isFinite(place.y)) continue;
    const group = svg('g', { class: 'marker', tabindex: '0', role: 'button', 'aria-label': `${place.name} 선택` });
    group.append(svg('circle', { cx: place.x, cy: place.y, r: 12 }), svg('circle', { cx: place.x, cy: place.y, r: 4, class: 'marker-core' }));
    const title = svg('title', {}); title.textContent = place.name; group.append(title);
    const choose = () => { selected.to = place; $('to').value = place.name; clearRoute(); setStatus(`${place.name}을 목적지로 선택했습니다.`); };
    group.addEventListener('click', choose); group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
    layer.append(group);
  }
}
function chooseInput(id) { const name = $(id).value.trim(); selected[id] = places.find(place => place.name === name) || null; return selected[id]; }
function showRoute() {
  const from = chooseInput('from'), to = chooseInput('to'); clearRoute();
  if (!from || !to) { setStatus('목록에 있는 출발지와 목적지를 선택해 주세요.'); return; }
  const start = placeNode(from), end = placeNode(to);
  if (!start || !end) { setStatus('선택한 시설에는 연결된 경로가 없습니다.'); return; }
  let route;
  try { route = fastestRoute(graph, start, end); } catch { setStatus('경로 데이터를 확인할 수 없습니다.'); return; }
  if (!route.reachable) { setStatus('두 시설을 연결하는 경로를 찾지 못했습니다.'); return; }
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const coords = route.nodeIds.map(id => nodes.get(id)).filter(Boolean);
  if (!coords.length) return;
  const points = [[from.x,from.y], ...coords.map(n => [n.x,n.y]), [to.x,to.y]].map(p => p.join(',')).join(' ');
  const layer = $('routeLayer');
  layer.append(svg('polyline', { points, class: 'route-halo' }), svg('polyline', { points, class: 'route-path' }));
  for (const [place, type] of [[from,'start'],[to,'end']]) {
    const group = svg('g', { class: `endpoint ${type}` });
    group.append(svg('circle', { cx:place.x, cy:place.y, r:19 }), svg('text', { x:place.x, y:place.y+6, 'text-anchor':'middle' }));
    group.lastChild.textContent = type === 'start' ? 'S' : 'E'; layer.append(group);
  }
  $('resultTitle').textContent = `${from.name} → ${to.name}`;
  $('time').textContent = `약 ${Math.max(1,Math.ceil(route.estimatedTimeSeconds / 60))}분`;
  $('distance').textContent = `추정 ${Math.round(route.estimatedDistanceM)}m`;
  $('result').hidden = false; setStatus('예상 경로를 지도에 표시했습니다.');
  const bounds = coords.reduce((b,n) => ({minX:Math.min(b.minX,n.x),maxX:Math.max(b.maxX,n.x),minY:Math.min(b.minY,n.y),maxY:Math.max(b.maxY,n.y)}), {minX:from.x,maxX:from.x,minY:from.y,maxY:from.y});
  $('map').scrollIntoView({ behavior:'smooth', block:'nearest' });
  const viewport = $('viewport');
  viewport.scrollTo({ left:((bounds.minX+bounds.maxX)/2)/graph.mapImage.width*$('map').clientWidth-viewport.clientWidth/2, top:((bounds.minY+bounds.maxY)/2)/graph.mapImage.height*$('map').clientHeight-viewport.clientHeight/2, behavior:'smooth' });
}
async function loadFloor(number) {
  floor = number; clearRoute(); selected = {from:null,to:null}; $('from').value = ''; $('to').value = '';
  document.querySelectorAll('[data-floor]').forEach(button => { button.classList.toggle('active', Number(button.dataset.floor) === floor); button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === floor)); });
  setStatus(`${floor}층 지도를 불러오는 중입니다.`);
  try {
    const response = await fetch(`/assets/json/floor-${floor}-graph.json`); if (!response.ok) throw new Error(response.status);
    graph = await response.json();
    places = graph.places.filter(place => placeNode(place) && place.name && Number.isFinite(place.x) && Number.isFinite(place.y));
    const { width,height } = graph.mapImage;
    $('map').setAttribute('viewBox', `0 0 ${width} ${height}`);
    $('floorImage').setAttribute('href', `/assets/daejeon-station-${floor}F-map.svg`);
    $('floorImage').setAttribute('width',width); $('floorImage').setAttribute('height',height);
    $('floorTitle').textContent = `${floor}F · 대전역`;
    $('map').setAttribute('aria-label', `대전역 ${floor}층 지도`);
    $('places').replaceChildren(...places.map(place => { const option=document.createElement('option'); option.value=place.name; return option; }));
    $('mapCount').textContent = `${places.length}개 시설`;
    drawMarkers(); setStatus(`${floor}층 시설 ${places.length}개를 검색할 수 있습니다.`); resetZoom();
  } catch { setStatus('지도 데이터를 불러오지 못했습니다. 새로고침해 주세요.'); }
}
function resetZoom() { zoom=1; $('map').style.width='100%'; $('viewport').scrollTo(0,0); }
function changeZoom(factor) { zoom=Math.max(1,Math.min(4,zoom*factor)); $('map').style.width=`${zoom*100}%`; }
document.querySelectorAll('[data-floor]').forEach(button => button.addEventListener('click',()=>loadFloor(Number(button.dataset.floor))));
$('route').addEventListener('click',showRoute);
for (const id of ['from','to']) { $(id).addEventListener('change',()=>{ selected[id]=null; clearRoute(); }); $(id).addEventListener('keydown',event=>{if(event.key==='Enter')showRoute();}); }
$('plus').addEventListener('click',()=>changeZoom(1.25)); $('minus').addEventListener('click',()=>changeZoom(.8)); $('reset').addEventListener('click',resetZoom);
loadFloor(3);
