export const normalize = value => String(value ?? '').toLocaleLowerCase('ko-KR').replace(/[\s()[\]·,./_-]+/g, '');

function words(value) {
  return String(value ?? '').toLocaleLowerCase('ko-KR').split(/[\s()[\]·,./_-]+/).filter(Boolean);
}

function oneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let left = 0, right = 0, edits = 0;
  while (left < a.length && right < b.length) {
    if (a[left] === b[right]) { left++; right++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) left++;
    else if (b.length > a.length) right++;
    else { left++; right++; }
  }
  return edits + (a.length - left || b.length - right ? 1 : 0) <= 1;
}

function tokenScore(query, candidate) {
  if (candidate === query) return 0;
  if (candidate.startsWith(query)) return 1;
  if (candidate.includes(query)) return 2;
  if (query.length >= 3 && oneEditApart(query, candidate)) return 3;
  return Infinity;
}

export function searchPlaces(places, query) {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return [];
  const queryWords = words(query);
  return places.flatMap(place => {
    const labels = [place.name, ...(place.aliases || [])];
    let score = Infinity;
    for (const [index, label] of labels.entries()) {
      const cleanLabel = normalize(label);
      if (cleanLabel === cleanQuery) score = Math.min(score, index === 0 ? 0 : 1);
      else if (cleanLabel.startsWith(cleanQuery)) score = Math.min(score, index === 0 ? 2 : 3);
      else if (cleanLabel.includes(cleanQuery)) score = Math.min(score, index === 0 ? 4 : 5);
    }
    if (score === Infinity && queryWords.length) {
      const candidates = labels.flatMap(words);
      const scores = queryWords.map(word => Math.min(...candidates.map(candidate => tokenScore(word, candidate))));
      if (scores.every(Number.isFinite)) score = 10 + scores.reduce((sum, value) => sum + value, 0);
    }
    return Number.isFinite(score) ? [{ place, score }] : [];
  }).sort((a, b) => a.score - b.score || Number(Boolean(b.place.nodeId)) - Number(Boolean(a.place.nodeId)) || a.place.name.localeCompare(b.place.name, 'ko'))
    .map(({ place }) => place);
}
export function shortestPath(graph, start, end) {
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  if(!nodes.has(start)||!nodes.has(end))return null;
  const adj=new Map([...nodes.keys()].map(id=>[id,[]]));
  for(const e of graph.edges){const w=Number(e.weight);if(!adj.has(e.source)||!adj.has(e.target)||!Number.isFinite(w)||w<0)continue;adj.get(e.source).push([e.target,w]);if(e.bidirectional)adj.get(e.target).push([e.source,w]);}
  const dist=new Map([[start,0]]),prev=new Map(),seen=new Set();
  while(true){let u=null,best=Infinity;for(const [id,d] of dist)if(!seen.has(id)&&d<best){u=id;best=d;}if(u===null)break;if(u===end)break;seen.add(u);for(const [v,w] of adj.get(u)){const d=best+w;if(d<(dist.get(v)??Infinity)){dist.set(v,d);prev.set(v,u);}}}
  if(!dist.has(end))return null;const ids=[];for(let u=end;u!==undefined;u=prev.get(u))ids.push(u);ids.reverse();return {ids,points:ids.map(id=>nodes.get(id)),weight:dist.get(end)};
}
export function localMeters(lat,lng,origin){const r=Math.PI/180,R=6371000;return [(lng-origin.lng)*r*R*Math.cos(origin.lat*r),(lat-origin.lat)*r*R];}
function solve(a,b){const n=b.length,m=a.map((row,i)=>[...row,b[i]]);for(let c=0;c<n;c++){let k=c;for(let i=c+1;i<n;i++)if(Math.abs(m[i][c])>Math.abs(m[k][c]))k=i;if(Math.abs(m[k][c])<1e-10)return null;[m[c],m[k]]=[m[k],m[c]];let d=m[c][c];for(let j=c;j<=n;j++)m[c][j]/=d;for(let i=0;i<n;i++)if(i!==c){d=m[i][c];for(let j=c;j<=n;j++)m[i][j]-=d*m[c][j];}}return m.map(row=>row[n]);}
export function fitAffine(anchors){if(anchors.length<3)return null;const origin={lat:anchors[0].lat,lng:anchors[0].lng};const rows=[],values=[];for(const a of anchors){const [x,y]=localMeters(a.lat,a.lng,origin);rows.push([x,y,1,0,0,0],[0,0,0,x,y,1]);values.push(a.x,a.y);}const n=6,A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>rows.reduce((v,r)=>v+r[i]*r[j],0))),b=Array.from({length:n},(_,i)=>rows.reduce((v,r,j)=>v+r[i]*values[j],0));const p=solve(A,b);return p?{origin,p}:null;}
export function project(fit,lat,lng){if(!fit)return null;const [x,y]=localMeters(lat,lng,fit.origin),p=fit.p;return [p[0]*x+p[1]*y+p[2],p[3]*x+p[4]*y+p[5]];}
export function validationError(train,check){const fit=fitAffine(train);if(!fit)return null;const p=project(fit,check.lat,check.lng);return Math.hypot(p[0]-check.x,p[1]-check.y);}
export function insideCalibrationArea(anchors,lat,lng){const o={lat:anchors[0].lat,lng:anchors[0].lng},p=localMeters(lat,lng,o),points=anchors.map(a=>localMeters(a.lat,a.lng,o));let minX=Math.min(...points.map(v=>v[0])),maxX=Math.max(...points.map(v=>v[0])),minY=Math.min(...points.map(v=>v[1])),maxY=Math.max(...points.map(v=>v[1]));return p[0]>=minX&&p[0]<=maxX&&p[1]>=minY&&p[1]<=maxY;}
