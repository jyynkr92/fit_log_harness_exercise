---
name: new-screen
description: Expo Router 화면을 레이어 규칙에 맞게 추가한다(라우트 + feature 레이어 뼈대 + Reusables UI). 새 화면/페이지를 만들 때 사용.
argument-hint: "<route path, 예: (tabs)/stats> <domain, 예: stats>"
---

# /new-screen

## 0. 입력 확인
- 라우트 경로 (예: `(tabs)/stats`, `workout/[id]`)
- 도메인 (`ARCHITECTURE.md` 도메인 표에서). 새 도메인이면 표에 추가.
- 스펙: `docs/product-specs/`에 해당 스펙이 있는지 확인. **없으면 스펙 초안을 먼저 작성**하고 사용자 확인.

## 1. 읽을 것
- `ARCHITECTURE.md` (레이어), `docs/FRONTEND.md` (화면 규약), `docs/DESIGN.md` (토큰)
- 같은 도메인의 기존 코드가 있으면 그 패턴을 따른다.

## 2. 생성할 구조 (필요한 레이어만)
```
app/<route>.tsx                         얇은 조립 (≈50줄)
features/<domain>/
  types/index.ts
  schema/<entity>.ts                    경계 파싱 (route params 포함)
  repo/<entity>Repo.ts                  supabase 호출 (여기서만)
  service/<logic>.ts (+ .test.ts)       순수 로직
  store/<domain>Store.ts                Zustand
  hooks/use<Thing>.ts
  components/<Thing>View.tsx            Reusables 조합
  index.ts                              public export
```

## 3. 라우트 파일 형태
```tsx
// app/(tabs)/stats.tsx — 조립만
import { StatsScreen } from '@/features/stats';
export default function StatsRoute() {
  return <StatsScreen />;
}
```
동적 라우트면 `useLocalSearchParams` → feature의 schema로 파싱 → 실패 시 not-found 처리.

## 4. 화면 컴포넌트 규약
- 4상태 렌더: loading(Skeleton) / empty / error(재시도) / success
- UI 프리미티브는 `@/components/ui/*`. 없으면:
  `npx @react-native-reusables/cli@latest add <component>`
- 색상은 시맨틱 토큰 클래스만. 터치 타겟 ≥ 44pt.
- `SafeAreaView` / 헤더 설정은 레이아웃(`_layout.tsx`) 규약 따름.

## 5. 검증
```bash
npm run typecheck
node scripts/check-architecture.mjs
npm test -- features/<domain>
```
가능하면 `npx expo start`로 띄워 실제 화면 확인 (iOS 시뮬레이터 등).

## 6. 마무리
- `docs/product-specs/<x>.md` 수용 기준 체크
- `docs/QUALITY_SCORE.md` 해당 도메인 행 갱신
- 다음 단계로 `/review` 제안
