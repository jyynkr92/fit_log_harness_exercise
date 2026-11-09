---
name: deploy
description: Supabase 마이그레이션과 EAS Update/Build/Submit으로 앱을 배포한다. 외부 영향이 있으므로 사용자가 명시적으로 요청할 때만.
disable-model-invocation: true
argument-hint: "[preview|production] [update|build|submit]"
---

# /deploy

상세 정책: `docs/RELEASE.md`. **모든 외부 영향 명령은 실행 전 사용자 확인.**

## 0. 인자 해석
- 채널: `preview`(기본) | `production`
- 방식: 미지정 시 아래 2단계에서 판단해 제안

## 1. 사전 검사 (하나라도 실패하면 중단)
```bash
git status --short          # 깨끗해야 함
git rev-parse --abbrev-ref HEAD   # production이면 main이어야 함
npm run typecheck && npm run lint && npm test
node scripts/check-architecture.mjs
```

## 2. OTA vs 빌드 판단
마지막 배포 태그(`git describe --tags --abbrev=0`) 이후 변경을 본다:
- `package.json`의 네이티브 모듈, `app.config.*`, `eas.json`, Expo SDK 변경 → **build**
- 그 외 JS/TS/에셋만 → **update**
- 확실치 않으면 `npx expo-updates fingerprint:generate` 결과 비교
판단 근거를 사용자에게 보여주고 확인받는다.

## 3. DB 마이그레이션 (있으면, 앱보다 먼저)
```bash
ls supabase/migrations/ ; npx supabase migration list
```
- 미적용 마이그레이션이 있으면 **하위 호환성**(구버전 앱 동작) 확인 후 사용자 확인 → `npx supabase db push`
- 파괴적 변경(drop/rename column)은 중단하고 2단계 마이그레이션을 제안.

## 4. 배포
| 방식 | 명령 |
| --- | --- |
| update | `eas update --channel <채널> --message "<요약>"` |
| build | `eas build --profile <채널> --platform all` |
| submit | `eas submit -p <ios\|android> --profile production` (production만) |

## 5. 마무리
- production이면 태그 제안: `git tag v<version>` (push는 사용자 확인)
- 배포 결과 URL/빌드 ID를 보고
- 배포 중 문제는 `docs/RELEASE.md`에 함정으로 기록 제안
