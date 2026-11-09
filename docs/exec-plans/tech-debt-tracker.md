# Tech Debt Tracker

`/cleanup`과 `/review`가 갱신한다. 해결되면 행을 지우지 말고 상태를 `resolved`로.

| ID | 발견일 | 위치 | 내용 | 영향 | 상태 |
| --- | --- | --- | --- | --- | --- |
| TD-001 | 2026-11-09 | `features/*/hooks` | 데이터 전체를 한 번에 로드 (페이지네이션 없음). 기록 수백 건 넘으면 느려짐 | med | open |
| TD-002 | 2026-11-09 | `features/workouts/store` | 오프라인 큐 없음. 네트워크 실패 시 세트 입력이 롤백됨 (RELIABILITY 목표 미달) | high | open |
| TD-003 | 2026-11-09 | `features/profile` | kg/lb 단위 설정 미구현 (프로필에 kg 고정 표시) | low | open |
| TD-004 | 2026-11-09 | `features/stats/components/VolumeChart` | 차트 라이브러리 미결정, View 막대 차트로 대체 | low | open |
| TD-005 | 2026-11-09 | `features/exercises` | 직접 추가한 종목은 카테고리가 항상 '기타' (선택 UI 없음) | low | open |
| TD-006 | 2026-11-09 | 테스트 | 컴포넌트/E2E 테스트 없음. 시뮬레이터 수동 검증만 수행 | med | open |
