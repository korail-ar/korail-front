# ui

대전역 길안내 새 프론트엔드입니다. Next.js 16(App Router) + TypeScript + Tailwind CSS v4 + Storybook 10으로 만들고,
테스트는 Vitest + Testing Library로 합니다.

```bash
cd ui
npm install
npm run dev        # http://localhost:3000
npm run storybook  # http://localhost:6006
```

커밋 전 검사: `npm run lint && npm run format:check && npm run typecheck && npm test`

- 프론트엔드 작업은 이 폴더 안에서만 합니다. 저장소 루트의 기존 웹앱(백엔드 작업자)은 건드리지 않습니다.
- 작업 규칙·스택·명령어: [`AGENTS.md`](AGENTS.md)
- 코드 컨벤션: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) (Airbnb 스타일 가이드 기준)
- 브랜치: `frontend` (프론트엔드의 main)
