import { describe, expect, it } from 'vitest';

import { compareGraphAndGrid } from './gridAudit';
import { polylineWalkability } from './spatial';

describe('independent spatial search', () => {
  it('finds a collision-free comparison path for both required 3F routes', () => {
    ['3F:P26', '3F:P50'].forEach((target) => {
      const result = compareGraphAndGrid('3F:C01', target);
      expect(result.gridPoints.length).toBeGreaterThan(1);
      expect(polylineWalkability('3F', result.gridPoints)).toBe('PASS');
      expect(result.ratio).not.toBeNull();
      expect(result.ratio!).toBeLessThan(1.2);
    });
  });
});
