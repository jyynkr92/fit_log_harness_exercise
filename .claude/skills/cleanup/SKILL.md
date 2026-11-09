---
name: cleanup
description: 가비지 컬렉션. 코드베이스의 드리프트(불변식 위반, 중복, 죽은 코드)와 낡은 문서를 찾아 작게 정리하고 QUALITY_SCORE와 tech-debt-tracker를 갱신한다. 주기적으로 또는 사용자가 정리를 요청할 때.
argument-hint: "[도메인 또는 경로 (선택)]"
---

# /cleanup

기술 부채는 고금리 대출이다. **작게, 자주** 갚는다. 한 번 실행에 1분 안에 리뷰 가능한 크기로.

## 1. 탐지
```bash
node scripts/check-architecture.mjs           # 불변식 위반
npm run lint -- --max-warnings=0 2>&1 | tail -30
npx knip 2>/dev/null || true                  # 미사용 파일/export/의존성 (설치돼 있으면)
```
추가로 직접 확인:
- 중복 로직: 비슷한 함수가 2곳 이상 → `lib/` 승격 후보
- 300줄에 근접한 파일 (250+)
- `TODO`/`FIXME` (`grep -rn "TODO\|FIXME" app features lib`)
- 파싱 없는 캐스팅: `grep -rn " as [A-Z]" features/*/repo`

## 2. 문서 정원 가꾸기 (doc-gardening)
- `CLAUDE.md`, `ARCHITECTURE.md`의 링크가 모두 살아있는지
- `ARCHITECTURE.md` 도메인 표 ↔ 실제 `features/` 폴더 일치
- `docs/generated/db-schema.md` ↔ `supabase/migrations/` 최신 반영
- `exec-plans/active/` 중 완료된 것 → `completed/`로 이동
- `CLAUDE.md`가 200줄 넘으면 내용을 docs/로 내린다

## 3. 정리 실행
- 기계적이고 안전한 것(미사용 import, 링크 수정, 문서 동기화)은 바로 수정.
- 동작 변경 위험이 있는 리팩터링은 **하나만** 골라 수행하거나 제안으로 남긴다.
- 고치지 않은 것은 `docs/exec-plans/tech-debt-tracker.md`에 추가.

## 4. 점수 갱신
`docs/QUALITY_SCORE.md`의 해당 칸 등급과 갭 로그를 갱신.

## 5. 승격 판단
같은 종류의 위반이 2회 이상 → `scripts/check-architecture.mjs`에 규칙 추가를 제안
(에러 메시지에 **고치는 방법** 포함).

## 6. 보고
```
정리함: n건 (목록)
부채 등록: TD-xxx …
품질 점수 변화: stats/service C → B
제안: (규칙 승격 / 다음 정리 대상)
```
커밋은 `/commit`으로 (type: `refactor` 또는 `docs`, scope 포함).
