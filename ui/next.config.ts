import path from 'node:path';

import type { NextConfig } from 'next';

// 저장소 루트(백엔드 웹앱)에도 package-lock.json이 있어서 Next.js가 루트를 워크스페이스 루트로
// 잘못 잡을 수 있다. 빌드·파일 추적·Turbopack 감시 범위를 ui/ 안으로 고정한다(AGENTS.md 2절).
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
