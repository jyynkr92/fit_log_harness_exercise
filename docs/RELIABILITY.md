# Reliability

## 에러 처리

- repo는 공통 에러 타입으로 변환해 throw. store가 잡아 `status: 'error'`로 노출. 화면은 error state 렌더.
- 사용자에게 보이는 메시지는 한국어, 재시도 버튼 제공.
- 앱 최상위 ErrorBoundary (`app/_layout.tsx`).

## 오프라인 (운동 중 네트워크 불안정 가정)

구현: [design-docs/0001-offline-outbox.md](design-docs/0001-offline-outbox.md)

- 모든 변경(운동 시작·완료·삭제, 세트 추가·삭제)은 **아웃박스**(AsyncStorage)에 먼저 쌓이고 화면에 즉시 반영된다.
- id 는 클라이언트에서 만든다(`expo-crypto` randomUUID) → insert 는 `upsert(ignoreDuplicates)` 라 재전송해도 안전.
- 재전송 시점: 연결 복구(NetInfo), 앱 포그라운드, 대기 작업이 있으면 15초마다.
- 네트워크 오류는 큐에 남기고 멈춘다. 권한·검증 오류처럼 재시도해도 안 될 작업은 버리고 배너로 알린다.
- 콜드 스타트는 기기 캐시(최근 20개) + 아웃박스로 먼저 그리고 서버로 갱신한다 (stale-while-revalidate).
- Supabase 클라이언트 자동 재시도는 끈다(`db.retry=false`, 10초 timeout). 아웃박스 재시도와 겹치면 오프라인 감지가 ~20초 늦어진다.
- 한계: 여러 기기에서 같은 운동을 동시에 고치는 충돌은 다루지 않는다(마지막 쓰기 승리).

## 성능 예산

| 항목                   | 목표                |
| ---------------------- | ------------------- |
| 콜드 스타트 → 첫 화면  | < 2s (중급 Android) |
| 세트 추가 탭 → UI 반영 | < 100ms (낙관적)    |
| 통계 화면 (1년치)      | < 500ms 계산        |

## 로깅

- 구조화 로그: `lib/logger` 사용. `console.log` 직접 사용은 개발 중에만.
