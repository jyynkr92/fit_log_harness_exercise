/* eslint-disable @typescript-eslint/no-require-imports */
// 테스트 공통 목: 네이티브 저장소·네트워크·Supabase 접속 정보
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// lib/supabase 는 import 시점에 환경변수를 검사한다. 테스트는 실제 서버에 접속하지 않는다.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
