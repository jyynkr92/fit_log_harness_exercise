# FitLog

> **하네스 기본 테스트용 프로젝트입니다.**
> [OpenAI 하네스 엔지니어링](https://openai.com/ko-KR/index/harness-engineering/) 원칙(지도를 주고, 불변식은 강제하고, 구현은 자유롭게)을
> Claude Code 하네스(CLAUDE.md · docs/ · Skills · Hooks)로 구성한 뒤,
> 그 하네스 위에서 에이전트가 실제 앱을 만들어 보며 검증하기 위한 저장소입니다. 실서비스용이 아닙니다.

운동 기록 + 통계 확인 모바일 앱입니다. Expo · Expo Router · NativeWind · React Native Reusables · Zustand · Supabase.

## 하네스 구성

| 구성        | 위치                                                             | 역할                                                                           |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 지도        | [CLAUDE.md](CLAUDE.md), [ARCHITECTURE.md](ARCHITECTURE.md)       | 어디를 봐야 하는지와 깨면 안 되는 불변식만. 상세는 링크로                      |
| 기록 시스템 | [docs/](docs/)                                                   | 설계 결정, 실행 계획, 스펙, 품질 점수, 기술 부채                               |
| 불변식 검사 | [scripts/check-architecture.mjs](scripts/check-architecture.mjs) | 레이어 방향, Supabase 접근 위치, feature 경계 등. 에러 메시지에 고치는 법 포함 |
| Skills      | [.claude/skills/](.claude/skills/)                               | `/new-screen` `/review` `/commit` `/cleanup` `/deploy`                         |
| Hooks       | [.claude/hooks/](.claude/hooks/)                                 | 비밀값 파일 보호, 네이티브 폴더 보호, 자동 포맷, 세션 종료 요약                |

## 앱 기능

- 이메일 가입/로그인 (Supabase Auth, 세션은 SecureStore)
- 운동 시작 → 종목 선택 → 세트(무게·횟수) 기록 → 완료. 지난 기록으로 다음 세트 자동 채움
- **오프라인 기록**: 연결이 없어도 기록이 기기에 쌓이고, 연결되면 순서대로 자동 동기화
- **kg / lb 전환**: 저장은 항상 kg, 표시·입력만 변환 (프로필 탭)
- 기록 목록 20개씩 무한 스크롤
- 통계: 4주/12주/1년 볼륨, 종목별 추정 1RM, 연속 운동 주

## 로컬 실행

필요: Node 22+, Docker Desktop, Xcode(iOS 시뮬레이터)

```bash
npm install
npm run db:start            # 로컬 Supabase (마이그레이션 + seed 자동 적용)
```

앱은 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` 가 필요합니다.
로컬 값은 `npx supabase status` 의 `API URL`, `anon key` 이며, 셸 환경변수로 넘기거나
직접 `.env.local` 에 넣습니다 (에이전트는 `.env*` 를 다루지 않습니다 — [docs/SECURITY.md](docs/SECURITY.md)).

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
npx expo start --ios
```

### 로컬 테스트 계정

로컬 Supabase 전용(이메일 인증 꺼짐)이며 운영 환경과 무관합니다.

| 용도                                   | 이메일                 | 비밀번호              |
| -------------------------------------- | ---------------------- | --------------------- |
| 기본 사용자 (E2E 로그인 플로우가 사용) | `tester@fitlog.test`   | `fitlog-local-test`   |
| RLS 검증용 다른 사용자                 | `intruder@fitlog.test` | `intruder-local-test` |

`npm run db:reset` 을 하면 계정과 기록이 모두 지워집니다. 기본 사용자는 앱에서 다시 가입하면 됩니다.

## 테스트

```bash
npm run typecheck           # tsc
npm run lint                # eslint
npm test                    # Jest: 순수 함수 + 컴포넌트(RNTL) + 오프라인 스토어 통합
npm run check:arch          # 하네스 불변식 검사
npm run e2e                 # Maestro E2E (아래 준비 필요)
```

### E2E 테스트 (Maestro)

iOS 시뮬레이터의 Expo Go 위에서 실제 앱을 조작합니다. 플로우는 [.maestro/](.maestro/) 에 있습니다.

| 플로우                  | 확인하는 것                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `01-signup-log-workout` | 신규 가입 → 세트 2개 기록 → 완료 → 기록·통계(추정 1RM) 반영 |
| `02-unit-lb`            | lb 전환 시 기록·입력 폼이 lb 로 표시, 다시 kg 로 복원       |
| `03-set-validation`     | 잘못된 횟수(0)는 저장되지 않고 안내 문구 표시               |

준비:

```bash
brew install openjdk@17 mobile-dev-inc/tap/maestro
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
```

1. `npm run db:start` 로 로컬 Supabase 실행
2. 위 "로컬 실행" 대로 `npx expo start --ios` (시뮬레이터에 Expo Go 설치·실행)
3. 앱에서 기본 테스트 계정(`tester@fitlog.test`)으로 한 번 가입
4. `npm run e2e` (시뮬레이터가 여러 대면 `maestro --device <UDID> test .maestro`)

각 플로우는 키체인을 지우고 로그아웃 상태에서 시작하며, 남은 진행 중 운동을 정리하고 단위를 직접 설정하므로 몇 번 돌려도 같은 결과가 나옵니다.

### 오프라인 수동 확인

API 게이트웨이 컨테이너만 멈추면 서버 접속 불가 상태를 만들 수 있습니다.

```bash
docker stop supabase_kong_fit_log_harness_exercise    # 오프라인
docker start supabase_kong_fit_log_harness_exercise   # 복구 → 15초 안에 자동 동기화
```

## 구조

```
app/              Expo Router 라우트 (조립만)
features/<도메인>/ types → schema → (repo | service) → store → hooks → components
components/ui/    Reusables 프리미티브
lib/              Supabase 클라이언트, 단위·네트워크·에러 등 공유 모듈
supabase/         마이그레이션, seed
.maestro/         E2E 플로우
docs/             설계·스펙·계획·품질·부채
```

상세: [ARCHITECTURE.md](ARCHITECTURE.md)
