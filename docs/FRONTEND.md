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

## 화면 상태 규약
모든 데이터 화면은 `loading` / `empty` / `error` / `success` 4상태를 렌더링한다.

## 폼
- 입력값은 제출 시 `schema/`로 파싱. 에러 메시지는 사용자 언어(한국어)로.

## 테스트
- `service/` 순수 함수: 단위 테스트 필수
- 컴포넌트: 핵심 플로우만 (React Native Testing Library)

## 체크리스트 (새 화면)
`/new-screen` 스킬 참조.
