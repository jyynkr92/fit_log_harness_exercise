/** repo 레이어가 던지는 공통 에러. raw Supabase 에러를 위로 올리지 않는다 (docs/BACKEND.md). */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: 'network' | 'auth' | 'validation' | 'not_found' | 'unknown' = 'unknown',
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

type ErrorLike = { message?: string; code?: string; status?: number; name?: string };

export function toAppError(error: unknown, fallback = '요청을 처리하지 못했습니다.'): AppError {
  if (error instanceof AppError) return error;
  const e = (error ?? {}) as ErrorLike;
  if (e.name === 'ZodError')
    return new AppError('서버 응답 형식이 올바르지 않습니다.', 'validation', error);
  if (e.message?.includes('Network request failed') || e.message?.includes('fetch')) {
    return new AppError('네트워크에 연결할 수 없습니다. 연결을 확인해 주세요.', 'network', error);
  }
  if (e.status === 400 || e.status === 401 || e.name?.startsWith('Auth')) {
    return new AppError(e.message ?? '인증에 실패했습니다.', 'auth', error);
  }
  if (e.code === 'PGRST116') return new AppError('데이터를 찾을 수 없습니다.', 'not_found', error);
  return new AppError(fallback, 'unknown', error);
}

export const errorMessage = (error: unknown) => toAppError(error).message;

/** 비동기 액션 상태 (docs/FRONTEND.md) */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
