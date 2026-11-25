import path from 'node:path';

import type { NextConfig } from 'next';

// 빌드·파일 추적·Turbopack 감시 범위를 실행 앱인 ui/ 안으로 고정한다.
const PROJECT_ROOT = path.resolve(__dirname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: PROJECT_ROOT,
  turbopack: {
    root: PROJECT_ROOT,
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
