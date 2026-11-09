# Quality Score

도메인 × 레이어별 품질 등급. `/cleanup`이 주기적으로 갱신한다.

등급: **A** 테스트·문서·규칙 준수 완비 · **B** 경미한 갭 · **C** 눈에 띄는 갭 · **D** 위험 · **—** 미구현

| 도메인 | types/schema | repo | service | store | UI | 테스트 | 문서 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| auth | A | A | — | B | B | C | B |
| workouts | A | A | A | B | B | B | B |
| exercises | A | A | — | B | B | C | B |
| stats | A | — | A | A | B | A | B |
| profile | — | — | — | — | C | C | C |

## 갭 로그
| 날짜 | 도메인/레이어 | 갭 | 조치 |
| --- | --- | --- | --- |
| 2026-11-09 | workouts/store | 오프라인 큐 없음 | TD-002 |
| 2026-11-09 | 전체 UI | 컴포넌트 테스트 없음 | TD-006 |
| 2026-11-09 | profile | 단위 설정 없음 | TD-003 |
