# 대전역 길안내

대전역 길안내 새 프론트엔드입니다. Next.js 16(App Router) + TypeScript + Tailwind CSS v4 + Storybook 10으로 만들고,
테스트는 Vitest + Testing Library로 합니다.

```bash
cd ui
npm install
npm run dev        # http://localhost:3000
npm run storybook  # http://localhost:6006
```

커밋 전 검사: `npm run lint && npm run format:check && npm run typecheck && npm test`

- 실행 가능한 웹앱은 이 `ui/` 폴더에 있습니다.
- 작업 규칙·스택·명령어: [`AGENTS.md`](AGENTS.md)
- 코드 컨벤션: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) (Airbnb 스타일 가이드 기준)
- 브랜치: `main`에서 `ui/...` 브랜치를 따서 작업하고 PR은 `main`으로 올립니다
- QR 출발점과 3층 경로 계산은 [`docs/WAYFINDING.md`](docs/WAYFINDING.md)에, 이전 실내 위치 추정 기술 검증은 [`docs/INDOOR_POSITIONING_TECH.md`](docs/INDOOR_POSITIONING_TECH.md)에 정리했습니다. GPS·센서 위치 추정은 현재 앱에 연결되어 있지 않습니다.
- 코드의 Model·ViewModel·View 책임과 화면 연결은 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)를 참고하세요.
- 배포(Vercel 등) 시 프로젝트 Root Directory는 `ui`로 지정합니다.
