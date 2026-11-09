# Stats

## 사용자 문제
내가 성장하고 있는지 한눈에 알고 싶다.

## 지표 (모두 `features/stats/service/`의 순수 함수 + 테스트)
- 주간 총 볼륨 (Σ weight × reps)
- 종목별 추정 1RM 추이 (Epley: w × (1 + reps/30))
- 운동 빈도 (주당 세션 수), 연속 기록(streak)
- PR 달성 이벤트

## 수용 기준
- [x] 기간 필터: 4주 / 12주 / 1년 (1년은 월 단위)
- [x] 데이터 없을 때 empty state
- [x] 계산 결과 단일 구현 (`features/stats/service/stats.ts`, 클라이언트 계산)

## 미정
- 차트 라이브러리 선택 → design-doc 필요 (현재 View 기반 막대 차트, TD-004)
