# Architecture

도메인과 레이어의 최상위 지도. 규칙 위반은 `scripts/check-architecture.mjs`가 잡는다.

## 도메인

| 도메인 | 경로 | 책임 |
| --- | --- | --- |
| auth | `features/auth/` | 로그인/세션 (Supabase Auth) |
| workouts | `features/workouts/` | 운동 세션·세트 기록 CRUD |
| exercises | `features/exercises/` | 운동 종목 카탈로그 |
| stats | `features/stats/` | 볼륨·PR·빈도 등 통계 계산과 시각화 |
| profile | `features/profile/` | 사용자 설정, 단위(kg/lb) |

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

## 데이터 흐름 예: 세트 기록

```
app/(tabs)/workout/[id].tsx
  └─ features/workouts/components/SetRow  (UI)
       └─ hooks/useWorkoutSession          (React 바인딩)
            └─ store/workoutSessionStore   (Zustand, 낙관적 업데이트)
                 ├─ repo/workoutRepo       (supabase.from('sets').insert → schema 파싱)
                 └─ service/volume         (순수 계산)
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
