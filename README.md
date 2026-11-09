# FitLog

운동 기록 + 통계 확인 앱 (Expo · Expo Router · NativeWind · React Native Reusables · Zustand · Supabase).
에이전트 작업 지도는 [CLAUDE.md](CLAUDE.md), 구조는 [ARCHITECTURE.md](ARCHITECTURE.md).

## 로컬 실행

필요: Node 22+, Docker Desktop, Xcode(iOS 시뮬레이터)

```bash
npm install
npm run db:start            # 로컬 Supabase (마이그레이션 + seed 자동 적용)
```

앱은 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 가 필요하다.
로컬 값은 `npx supabase status` 의 `API URL`, `anon key` 이며, 셸 환경변수로 넘기거나
직접 `.env.local` 에 넣는다 (에이전트는 `.env*` 를 다루지 않는다 — docs/SECURITY.md).

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
npx expo start --ios
```

### 로컬 테스트 계정

로컬 Supabase 전용(이메일 인증 꺼짐). 앱의 회원가입으로 만들어진다. 운영 환경과 무관.

| 용도                   | 이메일                 | 비밀번호              |
| ---------------------- | ---------------------- | --------------------- |
| 기본 사용자            | `tester@fitlog.test`   | `fitlog-local-test`   |
| RLS 검증용 다른 사용자 | `intruder@fitlog.test` | `intruder-local-test` |

`npm run db:reset` 하면 계정과 기록이 모두 지워진다.

## 검사

```bash
npm run typecheck
npm run lint
npm test
npm run check:arch
```
