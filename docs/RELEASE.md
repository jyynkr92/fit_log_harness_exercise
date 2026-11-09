# Release

## 채널

| 변경 종류                                      | 방법                  | 명령                                         |
| ---------------------------------------------- | --------------------- | -------------------------------------------- |
| JS/에셋만                                      | OTA (EAS Update)      | `eas update --channel <preview\|production>` |
| 네이티브 의존성·`app.config.ts`·SDK 업그레이드 | 새 바이너리           | `eas build --profile <preview\|production>`  |
| 스토어 제출                                    | EAS Submit            | `eas submit -p ios\|android`                 |
| DB 스키마                                      | Supabase 마이그레이션 | `npx supabase db push` (앱 배포 **전**)      |

## 판단 기준: OTA 가능?

`runtimeVersion` 정책(`appVersion` 또는 `fingerprint`)이 바뀌면 OTA 불가 → 빌드 필요.
`npx expo-updates fingerprint:generate`로 비교 가능.

## 순서

1. `main` 최신, 검사 전부 통과
2. DB 마이그레이션 (하위 호환 확인 — 구버전 앱이 깨지지 않게)
3. preview 채널 배포 → 확인
4. production 배포
5. `CHANGELOG` / 릴리스 노트

`/deploy` 스킬이 이 순서를 따르며, 각 외부 영향 단계 전에 사용자 확인을 받는다.
