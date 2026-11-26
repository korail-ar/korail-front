import { describe, expect, it } from 'vitest';

import { validateNavigationGraph } from './graphValidation';

describe('migrated graph validation', () => {
  it('has valid endpoint, distance and obstacle geometry', () => {
    const report = validateNavigationGraph();
    expect(report.nodeCount).toBe(153);
    expect(report.issues.filter((issue) => issue.severity === 'ERROR')).toEqual([]);
    expect(report.componentSizes[0]).toBe(151);
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: 'ZERO_EDGE', reference: '2F:2F-E012', severity: 'WARNING',
    }));
    expect(report.issues.some((issue) => issue.code === 'UNKNOWN_SPACE')).toBe(true);
  });
});
