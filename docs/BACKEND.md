# Backend (Supabase)

## 클라이언트
- 단일 인스턴스: `lib/supabase.ts`. **import는 `features/*/repo/`에서만** (불변식 #2).
- 타입: `lib/database.types.ts` (생성물). `createClient<Database>()`.
- 세션 저장: `expo-secure-store` 어댑터 (AsyncStorage 금지 → SECURITY).

## 마이그레이션 (불변식 #10)
```bash
npx supabase migration new <name>   # supabase/migrations/에 SQL 생성
npx supabase db reset               # 로컬 적용 + seed
npx supabase gen types typescript --local > lib/database.types.ts
```
- 대시보드에서 직접 스키마 변경 금지.
- 마이그레이션 후 `docs/generated/db-schema.md` 갱신.

## RLS
- 모든 테이블 `enable row level security`. 정책 없는 테이블 = 리뷰에서 블로커.
- 기본 패턴: `using (auth.uid() = user_id)`.
- `workout_sets`처럼 부모 소유권을 따르는 테이블은 `exists (select 1 from workouts ...)`.

## repo 레이어 규약
```ts
// features/workouts/repo/workoutRepo.ts
export async function listWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase.from('workouts').select('*').eq('user_id', userId);
  if (error) throw toRepoError(error);
  return WorkoutListSchema.parse(data); // 경계에서 파싱 (불변식 #3)
}
```
- 에러는 `lib/errors`의 공통 타입으로 변환. raw `PostgrestError`를 위로 올리지 않는다.

## Edge Functions
- `supabase/functions/<name>/`. 무거운 통계 집계가 필요해지면 고려 (design-doc 먼저).
