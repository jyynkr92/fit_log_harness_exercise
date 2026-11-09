---
name: commit
description: 검사(typecheck·lint·불변식)를 통과시킨 뒤 변경사항을 이모지 타입 규칙(✨ Feat, 🐛 Fix 등)으로 커밋한다. 사용자가 커밋을 요청할 때 사용.
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(npm run:*), Bash(node scripts/check-architecture.mjs:*)
---

# /commit

## 1. 상태 파악
```bash
git status --short
git diff --stat
git diff --cached --stat
```

## 2. 검사 (실패 시 커밋하지 말고 수정 → 재검사)
```bash
npm run typecheck
npm run lint
node scripts/check-architecture.mjs
```
스크립트가 아직 없으면(프로젝트 초기) 건너뛰고 사용자에게 알린다.

## 3. 스테이징 규칙
- 관련 파일만 명시적으로 `git add <path>`. `git add -A` / `git add .` 금지.
- 절대 포함 금지: `.env*`(`.env.example` 제외), `ios/`, `android/`, `.claude/session-logs/`.
- 서로 무관한 변경이 섞여 있으면 **여러 커밋으로 분리**를 제안.

## 4. 메시지 형식
```
<이모지> <Type>(<scope>): <요약, 한국어, 50자 이내, 마침표 없음>

<왜 바꿨는지. 무엇을은 diff가 말한다.>
<관련: docs/exec-plans/active/xxx.md, TD-00N 등>
```
예: `✨ Feat(workouts): 세트 추가 시 지난 기록 프리필`, `🛠 Chore(harness): 커밋 규칙 추가`

### 커밋 타입 (이모지 + 타입 표기를 그대로 사용)

| 타입 | 설명 |
| --- | --- |
| ✨ Feat | 새로운 기능을 추가한 경우 |
| 🐛 Fix | 버그를 수정한 경우 |
| 🎨 Design | UI 스타일이나 레이아웃 등 시각적 요소를 수정한 경우 |
| 💥 !BREAKING CHANGE | 기존 기능과 호환되지 않는 큰 변경이 있는 경우 |
| 🔥 !HOTFIX | 긴급하게 치명적인 문제를 수정한 경우 |
| 🎯 Style | 포맷팅, 세미콜론 등 기능에 영향을 주지 않는 수정 |
| ♻️ Refactor | 기능 변경 없이 코드 구조를 개선한 경우 |
| 💬 Comment | 주석을 추가하거나 수정한 경우 |
| 📚 Docs | 문서만 수정한 경우 |
| ✅ Test | 테스트 코드를 추가하거나 수정한 경우 |
| 🛠 Chore | 패키지, 설정 등 기능과 직접 관계 없는 작업 |
| 🔄 Rename | 파일/폴더명을 변경한 경우 |
| 🗑 Remove | 파일/폴더를 삭제한 경우 |

타입 선택 기준:
- 한 커밋엔 타입 하나. 두 타입이 섞이면 커밋을 나눈다.
- 🎨 Design: 시각적인 변경 (NativeWind 클래스, 레이아웃). 🎯 Style: 동작과 화면 모두 그대로인 코드 포맷팅.
- 💥 !BREAKING CHANGE: DB 스키마 비호환, OTA 불가(네이티브 변경), 공개 API 변경. 본문에 마이그레이션 방법 필수.
- 🔥 !HOTFIX: production 장애 대응일 때만. 그 외 버그는 🐛 Fix.

- scope: 도메인(`workouts`, `stats` …) 또는 `harness`, `db`, `ui`. 생략 가능.
- DB 마이그레이션 포함 시 본문에 `DB: <migration 파일명>` 명시.

## 5. 커밋 후
- `git log --oneline -3`으로 확인해 보여준다.
- push는 사용자가 요청할 때만.
