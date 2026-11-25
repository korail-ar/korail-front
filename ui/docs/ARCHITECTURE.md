# 앱 구조: MVVM

실행 앱은 `ui/` 하나다. Next.js App Router가 URL을 화면으로 연결하고, 화면은 ViewModel 훅에서 표시 데이터와 행동을 받는다.

| 계층      | 위치                                                                                            | 책임                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Model     | `src/data/station/`, `src/lib/station/data.ts`, `route.ts`, `search.ts`, `steps.ts`, `types.ts` | 시설·지도 데이터와 검색·경로·단계 계산. React 화면을 알지 않는다.                                               |
| ViewModel | `src/view-models/`, `src/lib/station/useJourney.ts`                                             | URL에서 여정을 복원하고, 화면별 입력·선택·이동 상태와 표시용 값을 만든다.                                       |
| View      | `src/app/**/*Screen.tsx`, `src/components/`                                                     | ViewModel 결과를 표시하고 사용자 이벤트를 전달한다. 지도 컴포넌트는 확대·층 선택처럼 위젯 자체의 상태를 가진다. |

```text
URL(start, to, platform, step)
  → useJourney (공통 여정 ViewModel)
  → 화면별 ViewModel (입력·선택·이동·표시값)
  → Screen (View) → 재사용 컴포넌트
                  ↘ Model의 정적 데이터·경로 계산
```

`start`, `to`, `platform`, `step`은 URL에 남으므로 화면 이동·새로 고침 후에도 다시 계산할 수 있다. `useJourney()`가 이를 읽어 출발점, 목적지, 경로, 단계, 오류 상태를 반환한다. 화면별 ViewModel은 검색어와 필터, 홈의 지도 모드, 승강장 선택처럼 해당 화면에만 필요한 임시 상태를 관리한다. 화면 간에 공유하는 별도 전역 저장소는 없다.

## 주요 흐름

1. `HomeScreen` → `useHomeViewModel`: QR 주소의 출발점을 보여 주고 검색·승강장 화면 링크를 만든다.
2. `SearchScreen` → `useSearchViewModel`: 검색어·분류를 관리하고 Model의 `searchPlaces()`와 `findRoute()`로 목록과 예상 시간을 만든다.
3. `RouteScreen` → `useRouteViewModel`: `useJourney()`의 경로를 지도 레이어로 바꾸고 안내 시작 행동을 제공한다.
4. `GuideScreen`·`StepListScreen` → `useGuideViewModel`: 현재 `step`의 지도 초점과 다음·이전·도착 주소를 만든다.
5. `ArriveScreen` → `useArriveViewModel`: 목적지 정보와 되돌아갈 주소를 만든다.

현재 위치는 GPS가 아니라 QR 또는 사용자가 지정한 출발점이다. 브라우저 위치 추정 기술은 [INDOOR_POSITIONING_TECH.md](INDOOR_POSITIONING_TECH.md)에 과거 실험으로 기록되어 있다.
