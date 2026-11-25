# AGENTS.md (ui/)

새 프론트엔드 작업 규칙입니다. 이 폴더에서 작업하는 사람과 AI 에이전트(Claude Code, Codex, Cursor 등)는 작업 전에 반드시 읽어 주세요.

## 1. 작업 범위

- **실행 가능한 웹앱은 `ui/` 안에 있습니다.** 명령은 이 폴더에서 실행합니다.
- 이전 루트 앱의 위치 추정 코드는 현재 앱에 연결되어 있지 않습니다. 기술 근거는 `docs/INDOOR_POSITIONING_TECH.md`에 남깁니다.
- lint, 포맷터, 코드 생성기, 일괄 검색·치환은 `ui/` 안에만 적용합니다.

## 2. 기술 스택

2026-11-22에 셋업했습니다. 버전은 `package.json`을 기준으로 합니다.

- **Next.js 16 (App Router, Turbopack)** + **React 19** + **TypeScript**
- **Tailwind CSS v4**: 설정 파일 없이 `src/styles/tokens.css`의 `@theme static`에 디자인 토큰을 정의합니다.
  Tailwind 기본 색·글자 크기·라운드·그림자는 지웠으므로 토큰 클래스만 씁니다(`docs/DESIGN_SYSTEM.md`).
  Next.js에서는 `@tailwindcss/turbopack` 로더, Storybook에서는 `@tailwindcss/vite` 플러그인으로 처리합니다.
- **Storybook 10** (`@storybook/nextjs-vite`, addon: docs, a11y)
- **테스트:** Vitest + Testing Library(jsdom). 테스트 파일은 `*.test.ts(x)`로 소스 옆에 둡니다.
- **lint/format:** ESLint 9(`eslint-config-airbnb-extended`) + Prettier. 자세한 내용은 `docs/CONVENTIONS.md` 6절에 있습니다.
- **패키지 매니저:** npm (`ui/package-lock.json`)

폴더 구조:

- `src/app/`: 라우트(App Router)
- `src/components/<Name>/`: 재사용 컴포넌트. `Name.tsx`, `Name.stories.tsx`, `Name.test.tsx`를 같은 폴더에 둡니다.
- `src/styles/tokens.css`: 디자인 토큰(Figma 기준). 화면을 만들 때는 새 값을 만들기 전에 토큰과 기존 컴포넌트부터 찾습니다.
- `src/design-system/`: Storybook 전용 문서 페이지(토큰 레퍼런스, Figma 컴포넌트 시트)
- `src/lib/`: 유틸(`cn` 등). `src/lib/station/`은 대전역 길찾기 로직(경로·단계·검색)
- `src/data/station/`: 3층 그래프. `source/`는 원본 복사본, `station3f.generated.json`은 `npm run build:station`으로 만든 지도 좌표 데이터
- `scripts/`: 데이터 생성 스크립트(`build-station-data.mjs`)
- `public/maps/`: 디자인팀 2D 층별 지도(`web-1F~4F-map.svg`)
- `public/icons/`: Figma 원본 아이콘 SVG(`Icon` 컴포넌트가 사용)
- `public/`: 정적 파일(Storybook `staticDirs`도 이 폴더를 씁니다)

자주 쓰는 명령(항상 `ui/` 안에서 실행):

| 명령                                      | 내용                                               |
| ----------------------------------------- | -------------------------------------------------- |
| `npm run dev`                             | 개발 서버                                          |
| `npm run build`                           | 프로덕션 빌드                                      |
| `npm run storybook`                       | Storybook (http://localhost:6006)                  |
| `npm run lint` / `npm run lint:fix`       | ESLint                                             |
| `npm run format` / `npm run format:check` | Prettier                                           |
| `npm run typecheck`                       | 라우트 타입 생성(`next typegen`) 후 `tsc --noEmit` |
| `npm test` / `npm run test:watch`         | Vitest                                             |
| `npm run build:station`                   | 3층 그래프 → 지도 좌표 데이터 다시 만들기          |

설정할 때 지킬 것(셋업에 반영됨, 설정을 바꿀 때도 지킵니다):

- 모든 설정 파일과 소스는 `ui/` 안에 만듭니다(예: `ui/package.json`, `ui/src/app`, `ui/src/components`, `ui/.storybook`).
  명령은 항상 `ui/` 안에서 실행합니다(`cd ui`).
- `next.config`에서 `outputFileTracingRoot`와 `turbopack.root`를 `ui/`로 지정합니다.
- Tailwind 스캔 대상, ESLint·Prettier 대상, Storybook `stories` 경로는 `ui/` 안으로만 한정합니다.
- 빌드 결과물 무시 규칙은 `ui/.gitignore`에 둡니다.
- 배포(Vercel 등)를 연결할 때는 프로젝트의 Root Directory를 `ui`로 지정합니다.

## 3. 브랜치와 커밋

- **작업 브랜치는 `main`에서 따고, PR도 `main`으로 올립니다** (2026-11-25부터. 예전 `frontend` 브랜치는 쓰지 않습니다).
  - 브랜치 이름은 `ui/` 접두어를 씁니다(예: `ui/search-screen`). `ui`라는 이름의 브랜치를 만들면
    git 규칙상 `ui/...` 브랜치를 만들 수 없으니 만들지 않습니다.
  - `main`에 직접 커밋·푸시하지 않습니다.
- **PR 단위:** 기능 추가 없이 디자인 반영만 하는 작업은 PR을 잘게 나누지 않고 한 PR에 모아 올립니다.
  PR을 다른 PR 브랜치 위에 쌓지 않습니다.
- **PR 본문:** 기능 요약 위주로 짧게 씁니다. 자세한 설명은 `docs/`에 두고 링크만 겁니다.
- `ui/`는 저장소의 하위 폴더일 뿐이며, 안에 별도 git 저장소(`git init`)를 만들지 않습니다.
- 커밋 메시지는 저장소의 기존 형식(Conventional Commits)을 따릅니다. 예: `feat(ui): ...`, `fix(ui): ...`, `chore(ui): ...`
  커밋 전에 `git status`로 의도한 파일만 바뀌었는지 확인합니다.

## 3-1. Git 작업 규칙 (AI 에이전트 필수)

- **작성자 표기 금지:** 커밋 메시지와 PR 본문에 `Co-Authored-By: ...`, `Generated with ...` 같은 AI·도구 작성자 표기를 넣지 않습니다.
  Claude Code는 `ui/.claude/settings.json`의 `attribution` 설정으로 자동 표기를 꺼 두었습니다.
- **git 명령은 미리 안내:** git 명령을 실행하기 전에 무엇을 왜 하는지, 결과가 어떻게 되는지 사용자에게 먼저 알립니다.
  대상은 커밋, 브랜치 생성·전환·삭제, merge, rebase, reset, stash, amend 등입니다.
  되돌리기 어려운 작업(`reset --hard`, 브랜치 삭제, 히스토리 수정 등)은 이유와 영향을 함께 설명합니다.
- **원격 작업은 매번 승인:** 원격 저장소와 주고받는 작업은 실행할 때마다 사용자에게 명시적으로 승인을 받습니다.
  - 대상: `push`(force push 포함), `pull`, `fetch`, `clone`, 원격 브랜치·태그 생성 및 삭제, `remote add/set-url`, PR 생성·수정·머지
  - 이전에 받은 승인을 다음 작업에 그대로 쓰지 않습니다.
- `main` 브랜치에 push 하거나 force push 하는 것은 승인이 있더라도 다시 한번 확인합니다.

## 3-2. 코드 컨벤션

- [Airbnb JavaScript / React 스타일 가이드](https://github.com/airbnb/javascript)를 기준으로 합니다.
  이 프로젝트에 맞게 정리한 내용은 [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)에 있으며, 코드를 작성하거나 리뷰할 때 따릅니다.

## 4. Claude Code 사용 시

- Claude Code는 **`ui/` 폴더에서 실행합니다**(`cd ui` 후 `claude`). 그래야 이 규칙(`ui/CLAUDE.md` → 이 파일)이 자동으로 읽히고,
  작업 폴더 밖의 파일을 수정하려 할 때 승인 요청이 뜹니다.
- 승인 요청에 `ui/` 밖의 경로가 보이면 거절합니다.

## 5. 이전 앱의 기술 자료

- 브라우저 위치 추정 실험과 검증 범위는 `docs/INDOOR_POSITIONING_TECH.md`에 정리했습니다. 이전 코드는 Git 이력에서 확인합니다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
