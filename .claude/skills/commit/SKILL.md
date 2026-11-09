---
name: commit
description: 검사(typecheck·lint·불변식)를 통과시킨 뒤 변경사항을 Conventional Commit으로 커밋한다. 사용자가 커밋을 요청할 때 사용.
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
<type>(<scope>): <요약, 한국어, 50자 이내, 마침표 없음>

<왜 바꿨는지. 무엇을은 diff가 말한다.>
<관련: docs/exec-plans/active/xxx.md, TD-00N 등>
```
- type: `feat` `fix` `refactor` `test` `docs` `chore` `perf` `build` `ci`
- scope: 도메인(`workouts`, `stats` …) 또는 `harness`, `db`, `ui`
- DB 마이그레이션 포함 시 본문에 `DB: <migration 파일명>` 명시.

## 5. 커밋 후
- `git log --oneline -3`으로 확인해 보여준다.
- push는 사용자가 요청할 때만.
