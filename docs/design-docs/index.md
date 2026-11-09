# Design Docs Index

설계 결정 기록. 새 결정은 `NNNN-제목.md`로 추가하고 이 표에 등록한다.

| #    | 제목                                     | 상태     | 검증             |
| ---- | ---------------------------------------- | -------- | ---------------- |
| —    | [core-beliefs](core-beliefs.md)          | Accepted | —                |
| 0001 | [offline-outbox](0001-offline-outbox.md) | Accepted | 단위·통합 테스트 |

상태: `Draft` → `Accepted` → (`Superseded by NNNN`)
검증: 결정이 코드/스크립트로 강제되는지 (`lint`, `check-arch`, `review`, `none`)

## 템플릿

```md
# NNNN. 제목

- 상태: Draft
- 날짜: YYYY-MM-DD

## 맥락

## 결정

## 결과 (트레이드오프)

## 강제 방법 (스크립트/린트/리뷰 체크리스트 중 무엇으로)
```
