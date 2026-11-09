# Frontend

## Expo Router

- `app/`는 **조립만**. 라우트 파일은 대략 50줄 이하가 목표 — feature의 hooks/components를 배치한다.
- 그룹: `(auth)`, `(tabs)`. 인증 게이트는 `app/_layout.tsx`에서 `features/auth`의 hook으로.
- 동적 파라미터(`useLocalSearchParams`)는 경계 입력이다 → feature `schema/`로 파싱 후 사용.
- 타입드 라우트(`experiments.typedRoutes`) 사용.

## 상태 관리 (Zustand)

- 스토어는 도메인당 `features/<domain>/store/`에. 전역 단일 스토어 금지.
- 서버 데이터의 진실은 Supabase. 스토어는 캐시 + UI 상태.
- 셀렉터로 구독 (`useStore(s => s.x)`), 전체 스토어 구독 금지.
- 비동기 액션은 `{ status: 'idle'|'loading'|'success'|'error', error? }` 형태로 상태 노출.
- persist가 필요하면 `zustand/middleware`의 persist + AsyncStorage (민감정보 저장 금지 → SECURITY).

## 입력 성능 규칙

- 키 입력마다 호출되는 store 액션은 **상태가 실제로 바뀔 때만 set** 한다
  (불필요한 리렌더로 controlled TextInput 글자가 누락된 사례: authStore.clearError).
- 폼 초기값을 바꾸려고 useEffect 안에서 setState 하지 말고, 부모가 `key` 로 리마운트한다.
- 렌더 중 `Date.now()` 금지 (react-hooks/purity) → `lib/useNow`.

## 화면 상태 규약

모든 데이터 화면은 `loading` / `empty` / `error` / `success` 4상태를 렌더링한다.

## 폼

- 입력값은 제출 시 `schema/`로 파싱. 에러 메시지는 사용자 언어(한국어)로.

## 테스트

| 종류     | 도구                         | 위치                                    | 대상                             |
| -------- | ---------------------------- | --------------------------------------- | -------------------------------- |
| 단위     | Jest                         | `**/service/*.test.ts`, `lib/*.test.ts` | 순수 함수 (필수)                 |
| 컴포넌트 | React Native Testing Library | `**/components/*.test.tsx`              | 입력·표시 규칙 (testID 로 조회)  |
| 통합     | Jest + repo 목               | `**/store/*.test.ts`                    | 오프라인 아웃박스 등 스토어 흐름 |
| E2E      | Maestro (Expo Go)            | `.maestro/*.yaml`                       | 핵심 사용자 여정                 |

- 공통 목은 `jest.setup.ts` (AsyncStorage, NetInfo, Supabase 환경변수).
- 스토어 테스트는 `AsyncStorage.clear()` + `jest.resetAllMocks()` 로 격리한다 (기기 저장소가 테스트 사이에 남는다).
- E2E 플로우는 독립적이어야 한다: 키체인을 지우고 시작, 남은 데이터 정리, 단위 같은 기기 설정은 직접 지정.

## 접근성·E2E 셀렉터 규칙 (실제로 겪은 문제)

- 탭·카드처럼 텍스트가 겹치는 곳은 **testID 로 선택**한다 (`tab-profile`, `auth-submit` 등).
  탭 버튼의 접근성 텍스트는 "프로필, tab, 4 of 4" 처럼 합쳐진다.
- `Pressable` 은 자식 텍스트를 하나의 접근성 요소로 합친다 → E2E 에서는 정규식으로 매칭.
- SVG 아이콘의 `accessibilityLabel` 은 트리에 안 잡힌다 → `View accessible accessibilityLabel` 로 감싼다.
- 숫자 키패드는 닫기 키가 없다 → 스크롤 화면에 `keyboardDismissMode="on-drag"` + `keyboardShouldPersistTaps="handled"`.
- JSX 속성 사이에 `//` 주석을 쓰지 않는다 (닫는 `>` 를 삼켜 번들이 깨진다). 주석은 `{/* */}` 로 태그 위에.

## 체크리스트 (새 화면)

`/new-screen` 스킬 참조.
