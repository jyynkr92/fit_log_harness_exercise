# Architecture

도메인과 레이어의 최상위 지도. 규칙 위반은 `scripts/check-architecture.mjs`가 잡는다.

## 도메인

| 도메인 | 경로 | 책임 |
| --- | --- | --- |
| auth | `features/auth/` | 로그인/세션 (Supabase Auth) |
| workouts | `features/workouts/` | 운동 세션·세트 기록 CRUD |
| exercises | `features/exercises/` | 운동 종목 카탈로그 |
| stats | `features/stats/` | 볼륨·PR·빈도 등 통계 계산과 시각화 |
| profile | `features/profile/` | 계정 정보, 로그아웃 (단위 설정은 미구현) |

> 도메인 추가 시 이 표를 갱신한다.

## 레이어

각 `features/<domain>/` 안에서 의존성은 **아래 허용 목록대로 한 방향**으로만 흐른다.
`service`는 순수 로직이라 `repo`와 나란히 있고, 둘을 엮는 건 `store`다.

```
types → schema ─┬→ repo ────┐
                └→ service ─┴→ store → hooks → components
lib/ (Providers: supabase, auth, theme, utils) — 어디서든 사용, 단 lib/supabase 는 repo 만
```

| 레이어 | import 가능한 같은 feature 레이어 |
| --- | --- |
| types | — |
| schema | types |
| repo | types, schema |
| service | types, schema |
| store | types, schema, repo, service |
| hooks | types, schema, service, store |
| components | types, schema, service, hooks |

> 이 표는 `scripts/check-architecture.mjs`의 `LAYER_ALLOW`와 동기화한다.

| 레이어 | 폴더 | 할 수 있는 것 | 할 수 없는 것 |
| --- | --- | --- | --- |
| types | `types/` | 도메인 타입 정의 | 어떤 런타임 import도 |
| schema | `schema/` | 경계 파싱/검증 (zod 등) | I/O |
| repo | `repo/` | Supabase 호출, 응답 파싱 | 비즈니스 로직, React |
| service | `service/` | 순수 비즈니스 로직 (통계 계산 등) | I/O, React, store |
| store | `store/` | Zustand 상태 + repo/service 호출 orchestration | React 컴포넌트 |
| hooks | `hooks/` | store/service를 React에 연결 | supabase 직접 호출 |
| components | `components/` | 도메인 UI (Reusables 조합) | repo, supabase |
| (public) | `index.ts` | 외부에 노출할 것만 re-export | — |

### 바깥 규칙

- `app/**` (라우트): `@/features/<x>` (index), `@/components/ui/*`, `@/lib/utils` 만 import.
- `components/ui/**`: Reusables 프리미티브. `features/` import 금지.
- `lib/**`: 어떤 feature도 import 금지 (Providers는 최하단).
- feature A → feature B: `@/features/B` (index) 로만.
- 순수 레이어(`types`/`schema`/`service`)는 다른 feature 를 **`import type` 으로만** 가져온다.
  feature index 는 store·repo·supabase 까지 끌고 와서 순수성과 단위 테스트를 깨뜨린다.
- `components/*.tsx`(ui 밖): 도메인 무관 공유 UI. `features/` import 금지.

## 데이터 흐름 예: 세트 기록

```
app/workout/[id].tsx                         (id 를 그대로 전달)
  └─ features/workouts/components/WorkoutSessionScreen
       ├─ components/SetEntryForm           (schema/SetFormSchema 로 입력 파싱)
       └─ hooks/useWorkouts                 (route param 파싱, React 바인딩)
            └─ store/workoutStore           (Zustand, 낙관적 업데이트 + 실패 시 롤백)
                 ├─ repo/workoutRepo        (supabase insert → WorkoutSetRowSchema 파싱)
                 └─ service/workoutMath     (순수 계산: 볼륨, 다음 세트 추천)
```

## 라우팅 구조 (Expo Router)

```
app/
  _layout.tsx           Providers 조립 (Theme, Auth gate)
  (auth)/sign-in.tsx
  (tabs)/_layout.tsx
  (tabs)/index.tsx      오늘의 운동
  (tabs)/history.tsx    기록 목록
  (tabs)/stats.tsx      통계
  (tabs)/profile.tsx
  workout/[id].tsx      세션 상세/진행
```

상세: [docs/FRONTEND.md](docs/FRONTEND.md)
