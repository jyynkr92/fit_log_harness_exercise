import type { User } from '@supabase/supabase-js';

import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import type { Credentials } from '../schema/credentials';
import type { AuthUser } from '../types';

const toAuthUser = (u: User): AuthUser => ({ id: u.id, email: u.email ?? null });

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toAppError(error);
  return data.session ? toAuthUser(data.session.user) : null;
}

export async function signIn({ email, password }: Credentials): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toAppError(error, '로그인에 실패했습니다.');
  return toAuthUser(data.user);
}

export async function signUp({ email, password }: Credentials): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw toAppError(error, '회원가입에 실패했습니다.');
  if (!data.user) throw toAppError(null, '회원가입에 실패했습니다.');
  return toAuthUser(data.user);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toAppError(error);
}

/** 세션 변화를 구독한다. 반환값은 구독 해제 함수. */
export function onAuthChange(listener: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session ? toAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}
