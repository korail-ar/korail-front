import { searchPlaces, shortestPath } from './station-route-math.js';
import { buildRouteSteps } from './route-steps.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
let graph;
let selected = { from: null, to: null }, route = null, steps = [], selectedStep = -1;
let zoom = 1;

const svg = (tag, attributes) => {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

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
    svg('polyline', { points, fill: 'none', stroke: '#fff', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    svg('polyline', { points, fill: 'none', stroke: '#e92758', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
  );
  if (selectedStep >= 0) {
    const segment = routePoints(steps[selectedStep].nodeIds);
    layer.append(
      svg('polyline', { points: segment, fill: 'none', stroke: '#fff', 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      svg('polyline', { points: segment, fill: 'none', stroke: '#1255a4', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-role': 'selected-step' })
    );
  }
  for (const [point, color, label] of [[route.points[0], '#1a73e8', '출발'], [route.points.at(-1), '#e92758', '도착']]) {
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
    const matches = searchPlaces(graph.places, input.value).slice(0, 15);
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
}

async function init() {
  try {
    const graphResponse = await fetch('/daejeon-station-3f-graph.json');
    if (!graphResponse.ok) throw Error('지도 데이터를 읽을 수 없습니다.');
    graph = await graphResponse.json();
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
