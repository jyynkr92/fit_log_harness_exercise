import NetInfo from '@react-native-community/netinfo';

/**
 * 연결 상태 구독. isInternetReachable 이 아직 모르면(null) 연결된 것으로 본다.
 * 실제 서버 도달 가능 여부는 요청 실패(AppError 'network')로 판단한다.
 */
export function subscribeOnline(listener: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((s) => {
    listener(Boolean(s.isConnected) && s.isInternetReachable !== false);
  });
}
