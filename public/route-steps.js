function objectParticle(name) {
  const lastHangul = [...name].reverse().find(char => /[가-힣]/.test(char));
  if (!lastHangul) return '를';
  return (lastHangul.charCodeAt(0) - 0xac00) % 28 ? '을' : '를';
}

export function buildRouteSteps(graph, path, from, to) {
  if (!path?.ids?.length) return [];
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  if (path.ids.length === 1) {
    return [{ number: 1, nodeIds: [path.ids[0]], text: `${to.name} 앞에 도착해 있습니다.` }];
  }

  const degree = new Map(graph.nodes.map(node => [node.id, 0]));
  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  }

  const boundaries = new Set([0, path.ids.length - 1]);
  for (let index = 1; index < path.ids.length - 1; index++) {
    const node = nodes.get(path.ids[index]);
    if (node && (/분기/.test(node.name) || (degree.get(node.id) || 0) >= 4)) boundaries.add(index);
  }
  const approachIndex = path.ids.length - 2;
  if (approachIndex > 0 && nodes.get(path.ids.at(-1))?.type === 'approach') boundaries.add(approachIndex);

  const points = [...boundaries].sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const nodeIds = path.ids.slice(start, end + 1);
    const target = nodes.get(path.ids[end]);
    let text;
    if (end === path.ids.length - 1) {
      text = `${to.name} 앞에 도착합니다.`;
    } else if (index === 0) {
      const via = nodes.get(path.ids[start + 1]);
      text = via && via.id !== target.id
        ? `${from.name}에서 ${via.name}${objectParticle(via.name)} 지나 ${target.name} 방향으로 이동하세요.`
        : `${from.name}에서 ${target.name} 방향으로 이동하세요.`;
    } else {
      const via = nodes.get(path.ids[start + 1]);
      text = via && via.id !== target.id
        ? `${via.name}${objectParticle(via.name)} 지나 ${target.name} 방향으로 이동하세요.`
        : `${target.name} 방향으로 이동하세요.`;
    }
    return { number: index + 1, nodeIds, text };
  });
}
