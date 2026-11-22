# 코드 컨벤션

[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)와
[Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)를 기준으로 하고,
Next.js(App Router) · Tailwind CSS · Storybook 환경에 맞게 일부를 조정했습니다.
아래에 없는 내용은 Airbnb 가이드 원문을 따릅니다.

> 아직 프로젝트 셋업 전이라 lint·포맷터 설정은 없습니다. 셋업할 때 "6. 도구"대로 설정해서 규칙을 자동으로 검사합니다.

## 1. 포맷

| 항목 | 규칙 |
|---|---|
| 들여쓰기 | 공백 2칸 |
| 따옴표 | JS/TS는 작은따옴표 `'`, JSX 속성은 큰따옴표 `"` |
| 세미콜론 | 항상 붙임 |
| 줄 길이 | 최대 100자 |
| 쉼표 | 여러 줄 객체·배열·인자·import 끝에 trailing comma |
| 중괄호 | `if`, `for` 등은 한 줄이어도 중괄호 사용 |
| 파일 끝 | 빈 줄 하나 |

## 2. JavaScript / TypeScript

- **변수:** `const`가 기본, 재할당할 때만 `let`. `var` 금지.
- **비교:** `===`, `!==`만 사용(`==` 금지).
- **객체·배열:** 리터럴(`{}`, `[]`)로 만들고, 복사·합치기는 spread(`...`)로 합니다. 축약 속성(`{ name }`)을 씁니다.
- **구조 분해:** 객체 속성을 2개 이상 꺼낼 때는 구조 분해를 씁니다.
- **문자열:** 조합할 때는 템플릿 리터럴(`` `${a}b` ``)을 씁니다.
- **함수:** 콜백은 화살표 함수를 씁니다. 매개변수 기본값은 맨 뒤에 두고, 매개변수를 재할당하지 않습니다.
- **반복:** 배열은 `for...in` 대신 `map`, `filter`, `reduce`, `forEach`를 씁니다.
- **모듈:**
  - `import`는 파일 맨 위에 두고, 같은 모듈은 한 번만 import합니다. import 순서는 외부 패키지 → 내부 별칭(`@/…`) → 상대 경로입니다.
  - export가 하나뿐인 모듈은 default export를 씁니다(Next.js의 `page`, `layout` 파일도 default export가 필수).
  - 유틸처럼 여러 개를 내보내는 모듈은 named export를 씁니다.
- **기타:**
  - 매직 넘버는 이름 있는 상수로 뺍니다.
  - 중첩 삼항 연산자는 쓰지 않습니다.
  - `console.log`는 커밋하지 않습니다. `console.warn`과 `console.error`만 허용합니다.
  - 주석에는 무엇을 하는지보다 **왜** 그렇게 하는지를 적습니다.

## 3. 이름 규칙

| 대상 | 규칙 | 예 |
|---|---|---|
| 변수·함수 | camelCase | `selectedPlace`, `findRoute()` |
| 컴포넌트·클래스·타입 | PascalCase | `RouteMap`, `PlaceCard`, `FloorGraph` |
| 상수(모듈 수준 불변값) | UPPER_SNAKE_CASE | `WALKING_SPEED_MPS` |
| boolean | `is`/`has`/`can` 접두어 | `isAccessible`, `hasElevator` |
| 이벤트 핸들러 prop / 함수 | `onX` / `handleX` | `onSelect`, `handleSelect` |
| 컴포넌트 파일 | 컴포넌트 이름과 같게 PascalCase | `RouteMap.tsx` |
| 그 밖의 파일 | camelCase | `routeMath.ts` |
| Next.js 라우트 폴더 | kebab-case (Next.js 규칙 우선) | `app/station-route/page.tsx` |

## 4. React / JSX

- **컴포넌트:** 파일당 컴포넌트 하나를 기본으로 합니다(작은 내부 전용 컴포넌트는 예외). 클래스 컴포넌트 대신 함수 컴포넌트와 Hooks를 씁니다.
- **props:**
  - camelCase로 짓고, 값이 `true`인 boolean은 값을 생략합니다(`<Button disabled />`).
  - DOM 속성 이름(`style`, `className`)을 다른 뜻으로 쓰지 않습니다.
  - 목록 렌더링의 `key`에는 배열 인덱스 대신 고유 id를 씁니다.
- **JSX 작성:**
  - 여러 줄 JSX는 괄호로 감쌉니다.
  - 자식이 없으면 self-closing(`<Icon />`)으로 씁니다.
  - 속성이 여러 개라 줄이 길어지면 속성마다 줄을 바꿉니다.
- **Hooks:**
  - 최상위에서만 호출합니다. 조건문과 반복문 안에서는 호출하지 않습니다.
  - 의존성 배열을 빠뜨리지 않습니다(`react-hooks/exhaustive-deps`).
  - 커스텀 훅 이름은 `useX`로 짓습니다.
- **Next.js:**
  - 컴포넌트는 Server Component가 기본입니다. 상태, 이벤트, 브라우저 API가 필요한 파일에만 `'use client'`를 붙입니다.
  - 내부 링크는 `next/link`, 이미지는 `next/image`를 씁니다.
- **접근성:** 이미지에는 `alt`를 넣습니다. 클릭 가능한 요소는 `<button>`이나 `<a>`로 만들고 `div onClick`은 쓰지 않습니다. 폼 입력에는 label을 연결합니다(`jsx-a11y` 규칙).

## 5. Tailwind CSS · Storybook

- **Tailwind:**
  - 스타일은 Tailwind 유틸리티 클래스로 작성하고, 클래스 순서는 Prettier 플러그인이 자동으로 정렬합니다.
  - 같은 클래스 조합이 3번 이상 반복되면 컴포넌트로 뽑습니다. `@apply`는 최소한으로만 씁니다.
  - 색, 간격, 글꼴 같은 값은 테마 토큰으로 정의해서 씁니다. 임의 값(`w-[37px]`)은 꼭 필요할 때만 씁니다.
  - 조건부 클래스는 문자열을 직접 이어 붙이지 말고 `clsx`/`cn` 유틸을 씁니다.
- **Storybook:**
  - 재사용 컴포넌트에는 `ComponentName.stories.tsx`를 같은 폴더에 둡니다.
  - 기본 상태와 주요 변형(비활성, 로딩, 오류, 긴 텍스트 등)을 스토리로 만듭니다.

## 6. 도구 (셋업 때 적용)

- **ESLint:** Airbnb 공식 패키지(`eslint-config-airbnb` 19.0.4, `-base` 15.0.0)는 2021년 이후 업데이트가 없고 ESLint 7·8만 지원합니다.
  Next.js 최신 설정(`eslint-config-next`)은 ESLint 9 이상이 필요해서 공식 패키지를 그대로 쓸 수 없습니다.
  셋업 때는 Airbnb 규칙을 ESLint 9 flat config로 옮긴 `eslint-config-airbnb-extended`(TypeScript 지원)와 `eslint-config-next`를 함께 쓰는 방향으로 검토합니다.
  패키지 이름과 버전은 2026-11 기준이므로 셋업 시점에 다시 확인합니다.
- **Prettier:** 포맷은 Prettier에 맡기고, `eslint-config-prettier`로 ESLint의 포맷 규칙을 끕니다.
  설정은 위 1절에 맞춥니다: `singleQuote: true`, `jsxSingleQuote: false`, `semi: true`, `trailingComma: 'all'`, `printWidth: 100`.
  Tailwind 클래스 정렬은 `prettier-plugin-tailwindcss`로 합니다.
- **검사 범위:** 모든 도구의 검사 대상은 `ui/` 안으로만 한정합니다(`AGENTS.md` 1절).
- **검사 시점:** 커밋 전에 lint와 format 검사를 통과해야 합니다. pre-commit 훅이나 CI 적용 여부는 셋업 때 정합니다.
