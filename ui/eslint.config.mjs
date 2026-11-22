import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { configs, plugins } from 'eslint-config-airbnb-extended';
import prettierConfig from 'eslint-config-prettier';
import storybook from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const GITIGNORE_PATH = path.join(PROJECT_ROOT, '.gitignore');

// Airbnb 규칙(eslint-config-airbnb-extended)을 기준으로 한다. 이 패키지의 next 설정에
// @next/eslint-plugin-next(core-web-vitals 포함)가 들어 있어서 eslint-config-next는 쓰지 않는다.
// 둘을 같이 쓰면 react·jsx-a11y·import 플러그인이 중복 등록되어 충돌한다.
export default defineConfig([
  includeIgnoreFile(GITIGNORE_PATH),
  globalIgnores(['.next/**', 'out/**', 'storybook-static/**', 'next-env.d.ts']),

  // JavaScript + Airbnb base
  { name: 'js/config', ...js.configs.recommended },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,

  // React + Next.js
  plugins.react,
  plugins.reactHooks,
  plugins.reactA11y,
  plugins.next,
  ...configs.next.recommended,

  // TypeScript
  plugins.typescriptEslint,
  ...configs.base.typescript,
  ...configs.next.typescript,

  // Storybook
  ...storybook.configs['flat/recommended'],

  {
    name: 'project/overrides',
    rules: {
      // 컴포넌트는 function 선언 또는 화살표 함수 모두 허용한다(Next.js 기본 생성 코드와 맞춘다).
      'react/function-component-definition': [
        'error',
        {
          namedComponents: ['function-declaration', 'arrow-function'],
          unnamedComponents: 'arrow-function',
        },
      ],
      // TypeScript의 선택적 props + 기본값 구조 분해로 충분하다.
      'react/require-default-props': 'off',
      // CONVENTIONS.md 2절: console.warn / console.error만 허용한다.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Next.js 라우트 파일, 설정 파일, 스토리는 default export가 프레임워크 요구 사항이다.
    name: 'project/framework-files',
    files: [
      'src/app/**/{page,layout,loading,error,not-found,template,default}.tsx',
      '*.config.{ts,mts,mjs}',
      '.storybook/**/*.{ts,tsx}',
      '**/*.stories.tsx',
    ],
    rules: {
      'import-x/no-default-export': 'off',
      'import-x/prefer-default-export': 'off',
    },
  },
  {
    // 설정 파일과 테스트·스토리는 devDependencies를 import한다.
    name: 'project/dev-files',
    files: [
      '*.config.{ts,mts,mjs}',
      'vitest.setup.ts',
      '.storybook/**/*.{ts,tsx}',
      '**/*.stories.tsx',
      '**/*.test.{ts,tsx}',
    ],
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },

  // 포맷 관련 규칙은 Prettier에 맡긴다(CONVENTIONS.md 6절). 반드시 마지막에 둔다.
  prettierConfig,
]);
