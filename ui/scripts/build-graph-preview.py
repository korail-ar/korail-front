"""Create a local plan/graph overlay preview: python scripts/build-graph-preview.py"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
graph = json.loads((root / 'src/data/daejeon_station_1to4f_combined_walk_graph.json').read_text(encoding='utf-8'))
floors = {}
for floor_id in ('1F', '2F', '3F'):
    floor = graph['floors'][floor_id]
    floors[floor_id] = {
        'nodes': [{'id': n['id'], 'x': n['x'], 'y': n['y']} for n in floor['nodes']],
        'edges': [{'id': e['id'], 'points': e['geometrySvg']} for e in floor['edges']],
    }
html = '''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>대전역 보행 그래프 확인</title><style>
body{font:15px system-ui;margin:0;background:#eef2f7;color:#172334}header{padding:12px 20px;background:white;position:sticky;top:0;z-index:2;box-shadow:0 1px 5px #aaa}button{padding:8px 16px;margin-right:8px;border:1px solid #789;border-radius:8px;background:white;cursor:pointer}button.active{background:#173d86;color:white}#canvas{position:relative;margin:20px auto;width:min(94vw,900px)}#plan{display:block;width:100%}#overlay{position:absolute;inset:0;width:100%;height:100%}.edge{fill:none;stroke:#e22;stroke-width:5;stroke-opacity:.75}.node{fill:#154cba;stroke:white;stroke-width:4}#info{font-size:13px;margin-left:12px}
</style><header><strong>대전역 보행 그래프 · 평면도 비교</strong><p>빨간 선: 이동 경로 후보 · 파란 점: 노드. 현장 통행 가능 여부는 검증 전입니다.</p><nav></nav><span id="info"></span></header><div id="canvas"><img id="plan" alt="층별 평면도"><svg id="overlay"></svg></div>
<script>const data=__DATA__;const boxes={'1F':[288,151,1098,1839],'2F':[616,1540,586,402],'3F':[126,125,1800,1752]};const nav=document.querySelector('nav');
function show(f){document.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.textContent===f));const img=document.querySelector('#plan'),svg=document.querySelector('#overlay');img.src='/maps/web-'+f+'-map.svg';svg.setAttribute('viewBox',boxes[f].join(' '));svg.innerHTML=data[f].edges.map(e=>'<polyline class="edge" points="'+e.points.map(p=>p.join(',')).join(' ')+'"><title>'+e.id+'</title></polyline>').join('')+data[f].nodes.map(n=>'<circle class="node" cx="'+n.x+'" cy="'+n.y+'" r="5"><title>'+n.id+'</title></circle>').join('');document.querySelector('#info').textContent=data[f].nodes.length+'개 노드 · '+data[f].edges.length+'개 연결선'}
Object.keys(data).forEach(f=>{let b=document.createElement('button');b.textContent=f;b.onclick=()=>show(f);nav.append(b)});show('1F');</script></html>'''
(root / 'public/graph-test.html').write_text(html.replace('__DATA__', json.dumps(floors, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')
