# FitLog — Agent Map

운동 기록 + 통계 확인 모바일 앱. **이 파일은 백과사전이 아니라 지도다.**
여기엔 "어디를 봐야 하는지"와 "절대 깨면 안 되는 것"만 있다. 상세는 링크를 따라가라.

## 스택 (한 줄 요약)

Expo (managed, CNG) · Expo Router · NativeWind · React Native Reusables · Zustand · Supabase · TypeScript strict

## 먼저 읽을 것 (작업 유형별)

| 하려는 일 | 읽을 문서 |
| --- | --- |
| 전체 구조 파악 | [ARCHITECTURE.md](ARCHITECTURE.md) |
| 화면 추가 | `/new-screen` 스킬 → [docs/FRONTEND.md](docs/FRONTEND.md) |
| UI/스타일 | [docs/DESIGN.md](docs/DESIGN.md) |
| DB·인증·API | [docs/BACKEND.md](docs/BACKEND.md), [docs/generated/db-schema.md](docs/generated/db-schema.md) |
| 기능 요구사항 | [docs/product-specs/index.md](docs/product-specs/index.md) |
| 큰 작업 계획 | [docs/PLANS.md](docs/PLANS.md) → `docs/exec-plans/active/` |
| 왜 이렇게 하나 | [docs/design-docs/core-beliefs.md](docs/design-docs/core-beliefs.md) |
| 품질 현황·부채 | [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md), [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md) |
| 보안·비밀값 | [docs/SECURITY.md](docs/SECURITY.md) |
| 에러·오프라인·성능 | [docs/RELIABILITY.md](docs/RELIABILITY.md) |
| 배포 | `/deploy` 스킬 → [docs/RELEASE.md](docs/RELEASE.md) |
| 외부 라이브러리 레퍼런스 | [docs/references/](docs/references/README.md) |

## 디렉터리 지도

```
app/                 Expo Router 라우트. 얇게 유지 (조립만, 로직 금지)
features/<domain>/   도메인 단위 코드. 레이어 규칙 적용 (아래)
components/ui/       Reusables 프리미티브 (CLI로 추가, 도메인 로직 금지)
components/*.tsx     도메인 무관 공유 UI (screen-state 등)
lib/                 Providers: supabase 클라이언트, auth, utils, theme
supabase/            migrations/, seed.sql, functions/
docs/                기록 시스템 (system of record)
scripts/             하네스 스크립트 (check-architecture 등)
ios/ android/        생성물. 직접 수정 금지 (hook이 차단)
```

## 불변식 (Invariants) — 기계적으로 강제됨

어기면 hook/스크립트/리뷰가 막는다. **구현 방법은 자유, 이 경계만 지켜라.**

1. **레이어 방향**: `features/<domain>/` 내부는
   `types → schema → (repo | service) → store → hooks → components` 방향으로만 import.
   역방향 금지, service는 순수(I/O 없음). 허용표: [ARCHITECTURE.md](ARCHITECTURE.md#레이어)
2. **Supabase 접근은 `repo/`에서만.** `@/lib/supabase`를 다른 곳에서 import 금지.
3. **경계에서 파싱.** 외부 데이터(Supabase 응답, 폼, 딥링크 파라미터)는 `schema/`로 검증 후 사용.
   추측한 형태로 코드 짜지 말 것 (라이브러리 선택은 자유, 현재 기본은 zod).
4. **feature 간 import는 public `index.ts`로만.** 다른 feature의 내부 파일 직접 import 금지.
5. **`app/` 라우트는 조립만.** supabase·store 내부 직접 접근 금지. feature의 hooks/components 사용.
6. **스타일은 토큰으로.** 하드코딩 색상(hex/rgb) 금지 → NativeWind 클래스 + 테마 토큰.
7. **파일 300줄 이하.** 넘으면 쪼갠다.
8. **비밀값 불가침.** `.env*` 읽기/쓰기 금지 (`.env.example` 제외). hook이 차단.
9. **네이티브 폴더 불가침.** `ios/`, `android/` 직접 수정 금지 → `app.config.ts` / config plugin으로.
10. **DB 변경은 마이그레이션으로.** 모든 테이블 RLS 활성화. 상세: [docs/BACKEND.md](docs/BACKEND.md)

검사: `node scripts/check-architecture.mjs` (1, 2, 4, 5, 6, 7 자동 검사)

## 명령어

```bash
npm run db:start                   # 로컬 Supabase (Docker)
npx expo start --ios               # 개발 서버 (환경변수: README "로컬 실행")
npm run typecheck                  # tsc --noEmit
npm run lint                       # eslint (expo flat config)
npm run check:arch                 # 불변식 검사
npm test                           # 단위 테스트 (service 레이어 위주)
npm run db:types                   # 마이그레이션 후 lib/database.types.ts 재생성
npx @react-native-reusables/cli@latest add <component>
```

## 작업 루프

1. 요구사항 확인 → `docs/product-specs/`에 없으면 먼저 스펙 초안 작성
2. 3개 파일 이상 / 하루 이상 걸릴 작업 → `docs/exec-plans/active/`에 계획 작성 ([PLANS.md](docs/PLANS.md))
3. 구현 → typecheck · lint · check-architecture 통과
4. `/review` 로 자체 리뷰 → 지적사항 수정 반복
5. `/commit`
6. 막혔던 지점은 "더 노력"이 아니라 **하네스 개선 신호**다:
   빠진 문서/규칙/스크립트를 찾아 레포에 추가한다.

## 스킬

| 스킬 | 용도 |
| --- | --- |
| `/new-screen` | 레이어 규칙에 맞춰 화면 + feature 뼈대 생성 |
| `/review` | 불변식 · 황금 원칙 기준 변경사항 리뷰 |
| `/commit` | 검사 통과 후 이모지 타입 규칙으로 커밋 (규칙: 스킬 내 표) |
| `/cleanup` | 가비지 컬렉션: 드리프트 탐지, 품질 점수/부채 갱신, 문서 정원 가꾸기 |
| `/deploy` | EAS Update / Build / Submit + Supabase 마이그레이션 (사용자 확인 필수) |

## 황금 원칙 (취향, 리뷰에서 강제)

- 직접 만든 헬퍼보다 `lib/` 공유 유틸 우선. 같은 로직 두 번 나오면 `lib/`로 승격
- 통계 계산은 순수 함수(`service/`)로, 반드시 단위 테스트
- 모든 화면은 loading / empty / error 상태를 가진다
- "지루한" 기술 선호. 새 의존성 추가 전 [core-beliefs](docs/design-docs/core-beliefs.md) 확인
- 문서로 부족한 규칙은 스크립트/린트로 승격한다

## 지식은 레포에

레포에 없는 것은 에이전트에게 존재하지 않는다.
결정을 내렸다면 `docs/design-docs/`에, 부채를 발견했다면 `tech-debt-tracker.md`에 기록한다.
문서와 코드가 다르면 **코드가 진실**이다 — 문서를 고치고 `/cleanup` 대상에 올린다.
