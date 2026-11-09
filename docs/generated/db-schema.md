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
| profiles | id (=auth.uid), unit_system, created_at | own row |
| exercises | id, name, category, is_custom, owner_id | public read + own custom |
| workouts | id, user_id, started_at, ended_at, note | own rows |
| workout_sets | id, workout_id, exercise_id, set_index, weight, reps, rpe | via workout owner |

(초기 설계안 — 첫 마이그레이션 작성 후 실제 스키마로 교체)
