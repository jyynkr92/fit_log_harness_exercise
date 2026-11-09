import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/lib/database.types';
import { chunkedSecureStorage } from '@/lib/secureStorage';

/**
 * Supabase 단일 클라이언트. features/<domain>/repo/ 에서만 import 한다 (CLAUDE.md 불변식 #2).
 * 값은 EXPO_PUBLIC_* 환경변수로 주입된다 (docs/SECURITY.md).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. README의 "로컬 실행"을 참고하세요.'
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  // 재시도는 오프라인 아웃박스가 담당한다. 클라이언트 자동 재시도(백오프)가 겹치면
  // 오프라인 감지가 ~20초 늦어진다. 요청은 10초 넘으면 실패로 본다.
  db: { retry: false, timeout: 10_000 },
  auth: {
    storage: chunkedSecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 앱이 포그라운드일 때만 토큰 자동 갱신
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
