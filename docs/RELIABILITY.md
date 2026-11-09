# Reliability

## 에러 처리
- repo는 공통 에러 타입으로 변환해 throw. store가 잡아 `status: 'error'`로 노출. 화면은 error state 렌더.
- 사용자에게 보이는 메시지는 한국어, 재시도 버튼 제공.
- 앱 최상위 ErrorBoundary (`app/_layout.tsx`).

## 오프라인 (운동 중 네트워크 불안정 가정)
- 세트 기록은 낙관적 업데이트 → 실패 시 로컬 큐에 보관 → 재연결 시 재전송.
- 큐 구현 방식은 자유 (design-doc으로 결정 기록).

## 성능 예산
| 항목 | 목표 |
| --- | --- |
| 콜드 스타트 → 첫 화면 | < 2s (중급 Android) |
| 세트 추가 탭 → UI 반영 | < 100ms (낙관적) |
| 통계 화면 (1년치) | < 500ms 계산 |

## 로깅
- 구조화 로그: `lib/logger` 사용. `console.log` 직접 사용은 개발 중에만.
