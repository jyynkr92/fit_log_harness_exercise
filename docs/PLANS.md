# Plans

계획은 일급 아티팩트다. 레포에 버전 관리되어야 에이전트가 외부 맥락 없이 이어서 작업할 수 있다.

## 언제 실행 계획(exec plan)을 쓰나

| 규모                                    | 방법                                        |
| --------------------------------------- | ------------------------------------------- |
| 1~2 파일, 한 세션                       | 계획 문서 없이 바로 진행                    |
| 3+ 파일, 여러 레이어, 마이그레이션 포함 | `exec-plans/active/YYYY-MM-DD-slug.md` 작성 |

완료되면 `exec-plans/completed/`로 이동. 발견한 부채는 [tech-debt-tracker](exec-plans/tech-debt-tracker.md)로.

## 템플릿

```md
# <제목>

- 시작: YYYY-MM-DD
- 관련 스펙: docs/product-specs/<x>.md
- 상태: in-progress | blocked | done

## 목표 / 완료 기준

- [ ] 측정 가능한 기준

## 단계

- [ ] 1. ...

## 결정 로그

- YYYY-MM-DD: 무엇을, 왜

## 진행 로그

- YYYY-MM-DD: 한 일 / 남은 일
```
