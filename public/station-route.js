import { searchPlaces, shortestPath } from './station-route-math.js';
import { buildRouteSteps } from './route-steps.js';
import { placeCategories, categoryForPlace } from './place-categories.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
let graph;
let selected = { from: null, to: null }, route = null, steps = [], selectedStep = -1;
let zoom = 1, activeCategory = 'all';
const searchRefreshers = [];

const svg = (tag, attributes) => {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

function shownPlaces() {
  return graph.places.filter(place => activeCategory === 'all' || categoryForPlace(place) === activeCategory);
}

function renderCategoryChips() {
  const chips = placeCategories.map(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-chip';
    button.setAttribute('aria-pressed', String(activeCategory === category.id));
    button.innerHTML = `<span class="chip-icon" aria-hidden="true"></span><span></span>`;
    button.children[0].textContent = category.icon;
    button.children[1].textContent = category.label;
    button.addEventListener('click', () => {
      activeCategory = category.id;
      renderCategoryChips();
      renderPlaceMarkers();
      for (const { input, box, showMatches } of searchRefreshers) {
        if (document.activeElement === input) showMatches();
        else box.replaceChildren();
      }
    });
    return button;
  });
  $('categoryChips').replaceChildren(...chips);
  const count = shownPlaces().length;
  $('categoryStatus').textContent = `${count}개 시설 · 지도 아이콘을 누르면 목적지로 선택됩니다.`;
}

function renderPlaceMarkers() {
  const layer = $('placeLayer');
  layer.replaceChildren();
  for (const place of shownPlaces()) {
    if (!Number.isFinite(place.x) || !Number.isFinite(place.y)) continue;
    const category = placeCategories.find(item => item.id === categoryForPlace(place));
    const marker = svg('g', { class: 'place-marker', role: 'button', tabindex: 0, 'aria-label': `${place.name} · ${category.label}`, 'data-category': category.id, 'data-place-id': place.id });
    const title = svg('title', {});
    title.textContent = place.name;
    const circle = svg('circle', { cx: place.x, cy: place.y, r: 19, fill: category.color, stroke: '#fff', 'stroke-width': 4 });
    const icon = svg('text', { x: place.x, y: place.y + 7, 'text-anchor': 'middle', 'font-size': 21, fill: '#fff', 'font-weight': 800, 'pointer-events': 'none' });
    icon.textContent = category.icon;
    marker.append(title, circle, icon);
    const choose = () => {
      if (!place.nodeId) {
        $('routeStatus').textContent = `${place.name}은 아직 경로가 연결되지 않았습니다.`;
        return;
      }
      selected.to = place;
      $('to').value = place.name;
      $('toResults').replaceChildren();
      clearRoute();
      $('routeStatus').textContent = `${place.name}을 목적지로 선택했습니다.`;
    };
    marker.addEventListener('click', choose);
    marker.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); }
    });
    layer.append(marker);
  }
}

function renderDemoLocation() {
  const point = graph.nodes.find(node => node.id === 'P40');
  if (!point) return;
  const marker = svg('g', { class: 'demo-location', 'aria-label': '시연 위치: 디자인스킨 앞', role: 'img' });
  marker.append(
    svg('circle', { cx: point.x, cy: point.y, r: 26, class: 'demo-pulse' }),
    svg('circle', { cx: point.x, cy: point.y, r: 15, fill: '#1679e9', stroke: '#fff', 'stroke-width': 5 }),
    svg('circle', { cx: point.x, cy: point.y, r: 5, fill: '#fff' }),
    svg('rect', { x: point.x + 23, y: point.y - 54, width: 190, height: 36, rx: 12, fill: '#0c5db8' }),
    svg('text', { x: point.x + 35, y: point.y - 30, fill: '#fff', 'font-size': 17, 'font-weight': 800, 'pointer-events': 'none' })
  );
  marker.lastChild.textContent = '시연 위치 · 디자인스킨 앞';
  $('demoLayer').replaceChildren(marker);
}

function routePoints(nodeIds) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  return nodeIds.map(id => `${nodes.get(id).x},${nodes.get(id).y}`).join(' ');
}

function drawRoute() {
  const layer = $('routeLayer');
  layer.replaceChildren();
  if (!route) return;
  const points = routePoints(route.ids);
  layer.append(
    svg('polyline', { points, fill: 'none', stroke: '#17324c', 'stroke-width': 25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    svg('polyline', { points, fill: 'none', stroke: '#ffdf3d', 'stroke-width': 15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-role': 'wayfinding-route' }),
    svg('polyline', { points, fill: 'none', stroke: '#fff8c9', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '22 14', class: 'route-flow', 'aria-hidden': 'true' })
  );
  if (selectedStep >= 0) {
    const segment = routePoints(steps[selectedStep].nodeIds);
    layer.append(
      svg('polyline', { points: segment, fill: 'none', stroke: '#fff', 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      svg('polyline', { points: segment, fill: 'none', stroke: '#1255a4', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-role': 'selected-step' })
    );
  }
  for (const [point, color, label] of [[route.points[0], '#1a73e8', '출발'], [route.points.at(-1), '#f48726', '도착']]) {
    layer.append(svg('circle', { cx: point.x, cy: point.y, r: 15, fill: color, stroke: '#fff', 'stroke-width': 5, 'aria-label': label }));
  }
}

function focusStep(step) {
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const points = step.nodeIds.map(id => nodes.get(id));
  const centerX = (Math.min(...points.map(point => point.x)) + Math.max(...points.map(point => point.x))) / 2;
  const centerY = (Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) / 2;
  requestAnimationFrame(() => {
    const scene = $('scene'), viewport = $('viewport');
    const scale = scene.clientWidth / graph.mapImage.width;
    viewport.scrollTo({
      left: Math.max(0, centerX * scale - viewport.clientWidth / 2),
      top: Math.max(0, centerY * scale - viewport.clientHeight / 2),
      behavior: 'smooth'
    });
  });
}

function selectStep(index) {
  if (index < 0 || index >= steps.length) return;
  selectedStep = index;
  drawRoute();
  for (const [cardIndex, card] of [...$('stepCards').children].entries()) {
    if (cardIndex === index) card.setAttribute('aria-current', 'step');
    else card.removeAttribute('aria-current');
  }
  $('guidePrev').disabled = index === 0;
  $('guideNext').disabled = index === steps.length - 1;
  $('guideProgress').textContent = `${index + 1} / ${steps.length}단계`;
  focusStep(steps[index]);
}

function clearRoute() {
  route = null;
  steps = [];
  selectedStep = -1;
  $('routeLayer').replaceChildren();
  $('stepCards').replaceChildren();
  $('routeSummary').hidden = true;
  $('routeDetails').hidden = true;
  $('guideControls').hidden = true;
  $('guideProgress').textContent = '단계를 선택하세요';
  $('guidePrev').disabled = true;
  $('guideNext').disabled = true;
  $('routeStatus').textContent = '출발지와 목적지를 검색해 선택하세요.';
}

function renderRoute() {
  clearRoute();
  const from = selected.from, to = selected.to;
  if (!from || !to) return;
  route = shortestPath(graph, from.nodeId, to.nodeId);
  if (!route) {
    $('routeStatus').textContent = '두 시설을 연결하는 경로가 없습니다.';
    return;
  }
  steps = buildRouteSteps(graph, route, from, to);
  $('routeSummaryText').textContent = `${from.name} → ${to.name}`;
  $('routeSummary').hidden = false;
  $('stepCount').textContent = `총 ${steps.length}단계`;
  const cards = steps.map(step => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step-card';
    button.dataset.nodeIds = step.nodeIds.join(',');
    const number = document.createElement('span');
    number.className = 'step-number';
    number.textContent = step.number;
    const text = document.createElement('span');
    text.className = 'step-text';
    text.textContent = step.text;
    button.append(number, text);
    button.addEventListener('click', () => selectStep(step.number - 1));
    return button;
  });
  $('stepCards').replaceChildren(...cards);
  $('routeDetails').hidden = false;
  $('guideControls').hidden = false;
  $('routeStatus').textContent = '경로가 표시되었습니다. 아래에서 단계를 확인하세요.';
  drawRoute();
}

function setupSearch(key) {
  const input = $(key), box = $(`${key}Results`);
  const showMatches = () => {
    const matches = searchPlaces(shownPlaces(), input.value).slice(0, 15);
    box.replaceChildren();
    for (const place of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = !place.nodeId;
      button.append(document.createTextNode(place.name));
      if (!place.nodeId) {
        const small = document.createElement('small');
        small.textContent = '경로 연결 전';
        button.append(small);
      }
      button.addEventListener('click', () => {
        selected[key] = place;
        input.value = place.name;
        box.replaceChildren();
        clearRoute();
      });
      box.append(button);
    }
    if (input.value && !matches.length) box.textContent = '검색 결과가 없습니다.';
  };
  input.addEventListener('input', () => {
    selected[key] = null;
    clearRoute();
    showMatches();
  });
  input.addEventListener('focus', showMatches);
  searchRefreshers.push({ input, box, showMatches });
}

async function init() {
  try {
    const graphResponse = await fetch('/daejeon-station-3f-graph.json');
    if (!graphResponse.ok) throw Error('지도 데이터를 읽을 수 없습니다.');
    graph = await graphResponse.json();
    renderCategoryChips();
    renderPlaceMarkers();
    renderDemoLocation();
    setupSearch('from');
    setupSearch('to');
    $('route').addEventListener('click', renderRoute);
    $('routeStatus').textContent = '시설을 검색해 선택하세요.';
  } catch (error) {
    $('routeStatus').textContent = `초기화 실패: ${error.message}`;
  }
}

$('guideStart').addEventListener('click', () => selectStep(0));
$('guidePrev').addEventListener('click', () => selectStep(selectedStep - 1));
$('guideNext').addEventListener('click', () => selectStep(selectedStep + 1));

function setZoom(next) {
  zoom = Math.max(1, Math.min(4, next));
  $('scene').style.width = `${zoom * 100}%`;
}
$('zoomIn').addEventListener('click', () => setZoom(zoom * 1.3));
$('zoomOut').addEventListener('click', () => setZoom(zoom / 1.3));
$('zoomReset').addEventListener('click', () => setZoom(1));
init();
