# Security

## 비밀값 (불변식 #8)

- `.env*` 파일은 에이전트가 읽거나 쓸 수 없다 (`.claude/hooks/protect-env.sh`).
- 필요한 키 목록은 `.env.example`에 **값 없이** 기록한다.
- 클라이언트 번들에 들어가는 값은 `EXPO_PUBLIC_*` 만. Supabase는 **anon key만** 앱에.
- `service_role` 키는 앱 코드·레포 어디에도 두지 않는다 (Edge Function 환경변수로만).

## 저장소

- 인증 토큰: `expo-secure-store`.
- AsyncStorage / Zustand persist에 토큰·개인정보 저장 금지.

## 데이터 접근

- 권한 검사는 **RLS가 최종 방어선**. 클라이언트 필터(`.eq('user_id', ...)`)는 편의일 뿐.

## 리뷰 체크

- [ ] 새 테이블에 RLS 정책
- [ ] 로그에 토큰/이메일 출력 없음
- [ ] 새 의존성의 출처·유지보수 상태 확인
