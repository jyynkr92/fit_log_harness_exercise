import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';

/** 앱 시작 시 한 번 호출해 세션 구독을 시작한다. */
export function useAuthBootstrap() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => init(), [init]);
  return useAuthStore((s) => s.status);
}

export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useSignOut = () => useAuthStore((s) => s.signOut);

export function useSignInForm() {
  const submit = useAuthStore((s) => s.submit);
  const submitting = useAuthStore((s) => s.submitting);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  return { submit, submitting, error, clearError };
}
