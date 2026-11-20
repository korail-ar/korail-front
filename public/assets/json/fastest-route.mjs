/** Dijkstra with nonnegative time costs. All supplied station times are estimates. */
class MinHeap {
  items = [];
  push(entry) {
    let i = this.items.length; this.items.push(entry);
    while (i > 0) { const parent = (i - 1) >> 1; if (this.items[parent][0] <= entry[0]) break; this.items[i] = this.items[parent]; i = parent; }
    this.items[i] = entry;
  }
  pop() {
    if (!this.items.length) return undefined;
    const first = this.items[0], last = this.items.pop();
    if (this.items.length) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1;
        if (child + 1 < this.items.length && this.items[child + 1][0] < this.items[child][0]) child++;
        if (this.items[child][0] >= last[0]) break;
        this.items[i] = this.items[child]; i = child;
      }
      this.items[i] = last;
    }
    return first;
  }
}
export function fastestRoute(graph, startId, targetId, { profile = graph.routingProfile || 'normal', verifiedOnly = false } = {}) {
  if (graph.weightUnit !== 's') throw new Error('Expected time weights with weightUnit="s".');
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  if (nodes.size !== graph.nodes.length) throw new Error('Duplicate node IDs.');
  if (!nodes.has(startId) || !nodes.has(targetId)) throw new Error('Unknown source or target node.');
  const adjacency = new Map([...nodes.keys()].map(id => [id, []]));
  for (const edge of graph.edges) {
    if (!nodes.has(edge.source) || !nodes.has(edge.target)) throw new Error(`Missing endpoint: ${edge.id}`);
    if (edge.enabled === false || (verifiedOnly && edge.verified !== true)) continue;
    const seconds = profile === (graph.routingProfile || 'normal') ? edge.weight : edge.estimatedTimeSecondsByProfile?.[profile];
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) throw new Error(`Invalid time/profile for edge ${edge.id}`);
    const arc = { edge, seconds };
    adjacency.get(edge.source).push({ ...arc, target: edge.target });
    if (edge.bidirectional === true) adjacency.get(edge.target).push({ ...arc, target: edge.source });
  }
  const costs = new Map([[startId, 0]]), previous = new Map(), heap = new MinHeap();
  heap.push([0, startId]);
  while (heap.items.length) {
    const [cost, id] = heap.pop();
    if (cost !== costs.get(id)) continue;
    if (id === targetId) break;
    for (const arc of adjacency.get(id)) {
      const candidate = cost + arc.seconds;
      if (candidate < (costs.get(arc.target) ?? Infinity)) {
        costs.set(arc.target, candidate); previous.set(arc.target, { id, edge: arc.edge });
        heap.push([candidate, arc.target]);
      }
    }
  }
  if (!costs.has(targetId)) return { reachable: false, nodeIds: [], edgeIds: [], estimatedTimeSeconds: null, estimatedDistanceM: null, profile };
  const nodeIds = [targetId], edges = [];
  while (nodeIds.at(-1) !== startId) { const step = previous.get(nodeIds.at(-1)); edges.push(step.edge); nodeIds.push(step.id); }
  nodeIds.reverse(); edges.reverse();
  const time = costs.get(targetId);
  const distance = edges.reduce((sum, edge) => sum + (edge.selectedDistanceM ?? edge.estimatedDistanceM ?? 0), 0);
  return {
    reachable: true, nodeIds, edgeIds: edges.map(e => e.id),
    estimatedTimeSeconds: time, displayTimeSeconds: Math.ceil(time),
    estimatedDistanceM: Math.round(distance * 10) / 10, profile,
    containsUnverifiedEdges: edges.some(e => e.verified !== true),
    assumptions: 'Walking speed assumption; waiting, congestion, turns and vertical travel excluded.'
  };
}
