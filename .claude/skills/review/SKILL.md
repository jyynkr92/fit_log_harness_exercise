---
name: review
description: 현재 브랜치(또는 미커밋) 변경사항을 이 레포의 불변식·황금 원칙·보안 기준으로 리뷰한다. 구현을 마친 뒤 커밋 전에, 또는 사용자가 리뷰를 요청할 때 사용.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git merge-base:*), Bash(node scripts/check-architecture.mjs:*), Bash(npm run:*), Read, Grep, Glob
---

# /review

리뷰 기준은 **불변식 위반 = 블로커**, 취향 차이 = 블로커 아님.
출력이 정확하고, 유지보수 가능하고, 다음 에이전트가 읽기 쉬우면 통과다.

## 1. 범위 결정
```bash
BASE=$(git merge-base HEAD main 2>/dev/null || echo HEAD)
git diff $BASE --stat; git diff --stat
```
인자가 있으면(`/review features/stats`) 해당 경로로 한정.

## 2. 기계 검사 먼저
```bash
node scripts/check-architecture.mjs
npm run typecheck && npm run lint
```
실패 항목은 그대로 🔴로 보고.

## 3. 수동 체크리스트 (CLAUDE.md 불변식 + 황금 원칙)

### 🔴 Blocker
- [ ] 레이어 역방향 import / supabase를 repo 밖에서 사용
- [ ] 외부 데이터를 파싱 없이 사용 (`as Workout` 캐스팅, `data!` 등)
- [ ] 새 테이블에 RLS 없음 / 대시보드 수동 변경 흔적
- [ ] 비밀값·토큰 로깅, `service_role` 사용
- [ ] `ios/`, `android/` 수정

### 🟡 Should fix
- [ ] 화면에 loading/empty/error 상태 누락
- [ ] `service/` 로직에 테스트 없음
- [ ] 같은 로직 중복 (→ `lib/`로 승격 제안)
- [ ] 하드코딩 색상/매직 넘버
- [ ] 새 의존성인데 design-doc 없음

### 🔵 Harness feedback
- [ ] 이 리뷰에서 반복된 지적이 있나? → 문서 갱신 또는 `check-architecture.mjs` 규칙 추가 제안
- [ ] 코드와 다른 문서 발견 → 해당 docs 수정 제안

## 4. 출력 형식
```
## Review: <범위>
🔴 Blocker (n)
- path:line — 문제 — 고치는 방법
🟡 Should fix (n)
🔵 Harness feedback (n)
✅ 좋았던 점 (1~2개)
```
지적만 하지 말고 **구체적 수정안**을 붙인다. 사용자가 원하면 바로 수정한다.
발견한 부채 중 지금 고치지 않을 것은 `docs/exec-plans/tech-debt-tracker.md`에 추가를 제안.
