import { create } from 'zustand';

import { errorMessage } from '@/lib/errors';

import * as authRepo from '../repo/authRepo';
import { CredentialsSchema } from '../schema/credentials';
import type { AuthStatus, AuthUser } from '../types';

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  submitting: boolean;
  error: string | null;
  init: () => () => void;
  submit: (mode: 'signIn' | 'signUp', input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'initializing',
  submitting: false,
  error: null,

  init: () => {
    authRepo
      .getCurrentUser()
      .then((user) => set({ user, status: user ? 'signedIn' : 'signedOut' }))
      .catch(() => set({ user: null, status: 'signedOut' }));
    return authRepo.onAuthChange((user) => set({ user, status: user ? 'signedIn' : 'signedOut' }));
  },

  submit: async (mode, input) => {
    const parsed = CredentialsSchema.safeParse(input);
    if (!parsed.success) {
      set({ error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' });
      return;
    }
    set({ submitting: true, error: null });
    try {
      const user =
        mode === 'signIn' ? await authRepo.signIn(parsed.data) : await authRepo.signUp(parsed.data);
      set({ user, status: 'signedIn', submitting: false });
    } catch (e) {
      set({ error: errorMessage(e), submitting: false });
    }
  },

  signOut: async () => {
    try {
      await authRepo.signOut();
    } finally {
      set({ user: null, status: 'signedOut' });
    }
  },

  // 키 입력마다 호출되므로 에러가 있을 때만 갱신 (불필요한 리렌더 → 입력 글자 누락 방지)
  clearError: () => {
    if (get().error !== null) set({ error: null });
  },
}));
