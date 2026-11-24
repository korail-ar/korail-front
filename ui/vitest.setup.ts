import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// globals 옵션을 쓰지 않으므로 Testing Library의 자동 cleanup이 동작하지 않는다. 테스트마다 직접 정리한다.
afterEach(() => {
  cleanup();
});
