# 디자인 시스템

대전역 길찾기 UI의 토큰과 컴포넌트입니다. Storybook(`npm run storybook`)에서 바로 볼 수 있습니다.

- **Foundations/Tokens**: 컬러·타이포·간격·라운드·그림자·크기 레퍼런스
- **Design Sheet/Components**: Figma 컴포넌트 시트를 실제 컴포넌트로 다시 배치한 페이지(디자인과 나란히 비교하는 용도)
- **Components/**, **Map/**: 컴포넌트별 스토리

## 출처 (Figma "Korail-Project")

| 내용                                           | Figma 노드 |
| ---------------------------------------------- | ---------- |
| 공통 컴포넌트(UI Components, Map & Wayfinding) | `82:72`    |
| 컬러 · 타이포 레퍼런스 v2                      | `110:96`   |

## 토큰

토큰은 `src/styles/tokens.css` 한 곳에서 Tailwind v4 `@theme static`으로 정의합니다.
Tailwind 기본 색·글자 크기·라운드·그림자는 지웠으므로 **토큰에 없는 값은 클래스로 쓸 수 없습니다**(`bg-blue-500` 같은 기본 팔레트도 없음).
모든 토큰은 CSS 변수(`--color-brand` 등)로도 노출됩니다.

| 종류      | 클래스 예                                                                                                                        | 비고                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 시맨틱 색 | `bg-surface` `text-ink-mute` `border-line` `bg-brand` `text-danger`                                                              | 컴포넌트에서는 시맨틱 색만 씁니다              |
| 원색      | `bg-blue-500` `bg-gray-200` `bg-mint-300` `bg-red-600`                                                                           | 시맨틱 토큰을 만들 때만 씁니다                 |
| 글자      | `text-display` `text-title` `text-heading` `text-body-lg` `text-button` `text-body` `text-label` `text-caption` `text-map-label` | 크기·줄 높이·굵기가 한 번에 적용됩니다         |
| 간격      | `p-1`(4) `gap-2`(8) `px-3`(12) `p-4`(16) `px-5`(20) `py-6`(24) `p-8`(32)                                                         | Tailwind 기본 4px 단위가 space 토큰과 같습니다 |
| 라운드    | `rounded-xs`(6) `rounded-sm`(8) `rounded-md`(12) `rounded-lg`(16) `rounded-xl`(24) `rounded-full`                                |                                                |
| 그림자    | `shadow-float` `shadow-sheet`                                                                                                    |                                                |
| 크기      | `size-tap-min`(48) `size-icon-sm/md/lg`(16/20/24) `size-marker-facility`(28) `size-marker-selected`(40)                          |                                                |

글꼴은 Noto Sans KR(`next/font/google`, 400·500·700)입니다.

### 주의: `cn()`과 커스텀 토큰

`tailwind-merge`는 `text-button` 같은 커스텀 글자 크기를 글자 색으로 착각해 `text-on-color`와 함께 쓰면 지워 버립니다.
`src/lib/cn.ts`에 글자·그림자 토큰 이름을 등록해 두었으니, **글자 크기 토큰을 추가하면 `cn.ts`의 `TEXT_TOKENS`에도 추가**해야 합니다.

## 아이콘

`public/icons/*.svg`는 Figma 원본(24 그리드 · 2px 선)입니다. `<Icon name="pin" size={20} />`처럼 쓰며,
SVG를 CSS 마스크로 칠하므로 색은 `text-*` 클래스(currentColor)로 정합니다. 아이콘 이름은 `ICON_NAMES`에 있습니다.
Figma 설명대로 임시 그림이며, 역 안내 픽토그램이 정해지면 같은 파일 이름으로 바꾸면 됩니다.

## 컴포넌트

| 컴포넌트                                                        | 경로                           | 메모                                            |
| --------------------------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| Icon                                                            | `components/Icon`              |                                                 |
| Button (primary · secondary · text)                             | `components/Button`            | Pressed = `:active`, Disabled = `disabled`      |
| IconButton                                                      | `components/IconButton`        | `label`(화면 낭독용 이름) 필수                  |
| CategoryChip                                                    | `components/CategoryChip`      | 선택 시 아이콘이 체크로, `aria-pressed`         |
| Tag (neutral · info · start · warn)                             | `components/Tag`               |                                                 |
| NumberBadge (exit · platform · car)                             | `components/NumberBadge`       | 화면 낭독기에는 "타는 곳 5"처럼 읽힘            |
| SearchField                                                     | `components/SearchField`       | Focus = `:focus-within`, `floating`은 지도 위용 |
| ResultItem                                                      | `components/ResultItem`        | 줄 전체가 버튼                                  |
| MapMarker (7종)                                                 | `components/MapMarker`         |                                                 |
| MapLabel (facility · strong · start)                            | `components/MapLabel`          |                                                 |
| RouteLine                                                       | `components/RouteLine`         | 지도 `<svg>` 안에 넣는 `<g>`. 좌표 배열을 받음  |
| ZoomControl · RecenterControl · FloorControl                    | `components/MapControl`        |                                                 |
| FacilityCard                                                    | `components/FacilityCard`      | 정보 줄 최대 3개                                |
| RouteSummary                                                    | `components/RouteSummary`      |                                                 |
| StepItem (done · current · next)                                | `components/StepItem`          | `<ol>` 안에 둠, current는 `aria-current="step"` |
| StepBar                                                         | `components/StepBar`           | `role="status"`                                 |
| BottomSheet                                                     | `components/BottomSheet`       | 손잡이로 접기/펴기                              |
| StateMessage (loading · empty · needs-check · no-route · error) | `components/StateMessage`      | 기본 문구 내장, 오류만 빨강                     |
| RouteEndpoint (start · end)                                     | `components/RouteEndpoint`     | 경로 출발(노랑)·도착(파랑) 원형 점(2026-11-25)  |
| JourneyMilestones                                               | `components/JourneyMilestones` | QR 출발 → 경유 → 도착 여정 표시(2026-11-25)     |
| StationMap · StationMap3D                                       | `components/StationMap*`       | 2D 지도(경로·표시) · 층을 쌓은 3D 지도          |

## Figma와 다르게 구현했거나 디자이너 확인이 필요한 것

1. ~~목적지·시작 위치 색이 두 곳에서 다릅니다.~~ **2026-11-24 화면(W01~W11) 변수로 정리했습니다.**

   | 토큰         | 이전(컴포넌트 변수) | 지금(2026-11-24 Figma 변수)          |
   | ------------ | ------------------- | ------------------------------------ |
   | `dest`       | `#0D7A6B`           | `#2F47C2` (`blue-700`)               |
   | `start`      | `#F2B705`           | `#FFF3C4` (`sunflower-100`)          |
   | `start-soft` | `#FFF8E1`           | `#FFF3C4` (`sunflower-100`)          |
   | `start-ink`  | `#B8860B`           | `#22314A` (`ink-900`) — 노랑 위 글자 |

   같은 때 화면 글자색도 바뀌었습니다: `ink` `#171717` → `#22314A`(`ink-900`), `ink-sub` `#454545` → `#6B7280`(`ink-600`).
   지도 이름표(MapLabel strong)는 Figma에서 계속 `#171717`이라 `map-label-strong`(`gray-900`)으로 따로 뺐습니다.
   층 이동 마커·이름표는 민트(`floor-marker` = `mint-50`)로 바뀌었습니다.

2. **글자 굵기:** 레퍼런스 v2는 `body-lg`·`label`·`map-label`을 w600으로 적었지만, 컴포넌트 변수는 w700입니다. w700을 썼습니다.
3. **`radius-xs`(6px):** 토큰 목록에는 없지만 Tag·MapLabel·NumberBadge가 공통으로 써서 이름을 붙였습니다.
4. **그림자:** SearchField(Float)·StepBar·BottomSheet는 Figma에서 토큰과 조금 다른 그림자(`0 2px 4px`, `0 -4px 10px`)를 쓰고 있어 `shadow-float`·`shadow-sheet` 토큰으로 맞췄습니다.
5. **FacilityCard 머리:** Figma의 왼쪽 여백 12px 때문에 카드 폭을 넘고 아래 정보 줄과 정렬이 어긋나서 여백을 뺐습니다.
6. **목적지 마커:** Figma 에셋에는 핀 안 아이콘(티켓)이 고정되어 있습니다. 목적지마다 아이콘이 바뀌어야 해서 핀 모양은 코드로 그리고 아이콘은 `icon` prop으로 받습니다.
7. **경로선:** Figma는 미리보기 그림이므로 좌표를 받아 그리는 컴포넌트로 만들었습니다(흰 테두리 12px + 6px 선, Transfer는 점선).
8. **없는 상태:** hover는 Primary 버튼에만 `brand-hover`를 넣었습니다. 키보드 포커스는 모든 누르는 요소에 `focus` 색 2px 외곽선을 넣었습니다. 다크 모드는 디자인이 없어 지원하지 않습니다.
9. **민트:** "최대 700까지만 사용"이라고 되어 있지만 500까지만 정의되어 있습니다.
10. **화면 글자 크기(2026-11-24 추가):** 화면 시안에 Figma 글자 스타일로 등록되지 않은 크기가 반복되어 토큰으로 만들었습니다.
    `screen-title`(26/39 w700, 화면 큰 제목), `subtitle`(20/30 w700), `body-sm`(14/21 w400), `note`(12/18 w400).
    W01 하단 패널 제목은 시안이 24px이지만 `screen-title`(26px)로 맞췄습니다. 글자 스타일로 등록할지 확인이 필요합니다.
11. **StepItem·FacilityCard(2026-11-24 반영):** StepItem은 줄 배경(완료 회색 · 지금 파랑 · 다음 흰색)이 생겼고,
    FacilityCard 정보 줄은 15px(`body`)로 커졌습니다. 주요 버튼 아이콘은 `actionIcon`으로 끌 수 있습니다(W10).
12. **2026-11-25 추가:** 경로 출발 점·여정 출발 점 색 `route-start`(`sunflower-300` #FFD93D), 도착 `route-end`, 아직 안 간 지점
    `milestone-upcoming`(`blue-100`), 화면 큰 제목 `headline`(24/34 w700, 로딩·도착·오류 화면). 지도의 목적지 핀(MapMarker destination)은
    경로 화면에서 Route/Endpoint로 바뀌었지만 컴포넌트는 남겨 두었습니다. 도착 화면 FacilityCard는 버튼 없이(`showAction={false}`) 씁니다.
    일러스트(QR 스캔 · 경로 탐색 · 도착 완료 · 경고 삼각형)는 Figma 원본 SVG를 `public/illustrations/`에 두었습니다.
