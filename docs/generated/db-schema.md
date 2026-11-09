# DB Schema (generated)

> ⚠️ 생성 파일. 직접 수정하지 말 것. 마이그레이션 변경 후 재생성.
>
> ```bash
> npx supabase gen types typescript --local > lib/database.types.ts
> ```
> 그 다음 이 문서의 테이블 요약을 갱신한다 (`/cleanup`이 drift 점검).

## Tables

| 테이블 | 주요 컬럼 | RLS |
| --- | --- | --- |
| exercises | id, name, category, owner_id (null=기본 제공), created_at | 기본+내 것 조회, 내 것만 수정 |
| workouts | id, user_id (default auth.uid()), started_at, ended_at, note | 내 것만 |
| workout_sets | id, workout_id, exercise_id, set_index, weight numeric(6,2), reps, created_at | 부모 workout 소유자만 |

출처: `supabase/migrations/20261109000000_init_workouts.sql` · seed: 기본 종목 13개 (`supabase/seed.sql`)
