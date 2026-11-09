export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthStatus = 'initializing' | 'signedIn' | 'signedOut';
