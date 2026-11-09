# 0001. 오프라인 기록: 클라이언트 id + 아웃박스

- 상태: Accepted
- 날짜: 2026-11-09

## 맥락

헬스장은 네트워크가 자주 끊긴다. 기존 구현은 낙관적 업데이트 후 실패하면 롤백해서 입력이 사라졌다 (TD-002).

## 결정

- 모든 변경을 작업(op)으로 만들어 **아웃박스**에 쌓고 기기(AsyncStorage)에 저장한다. 화면은 `서버 목록 + 아웃박스 재생`.
- 운동·세트 id 는 클라이언트에서 생성한다. insert 는 `upsert(onConflict id, ignoreDuplicates)` 이므로 같은 작업을 몇 번 보내도 결과가 같다.
- 큐를 넣을 때 상쇄되는 작업은 합친다: 아직 안 보낸 세트를 지우면 addSet 도 사라지고, 아직 안 보낸 운동을 지우면 그 운동의 작업이 모두 사라진다.
- flush 는 순서대로 하나씩. 네트워크 오류면 멈추고, 그 외 오류는 해당 작업을 버리고 알린다.
- 큐 로직은 `service/outbox.ts` 순수 함수(테스트), 저장은 `repo/localStore.ts`, 조율은 `store/workoutStore.ts`.

## 결과 (트레이드오프)

- 라이브러리(WatermelonDB, PowerSync 등) 없이 ~150줄. 대신 다기기 동시 편집 충돌은 다루지 않는다 (TD-007).
- 통계는 서버에서 기간별로 조회하므로 대기 중 기록은 동기화 후 반영된다. 오프라인일 땐 기기 데이터로 계산한다.

## 강제 방법

- `features/workouts/service/outbox.test.ts` (상쇄·재생·멱등), `store/workoutStore.test.ts` (오프라인 → 복구 시나리오).
