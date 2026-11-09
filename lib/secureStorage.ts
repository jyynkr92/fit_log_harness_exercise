import * as SecureStore from 'expo-secure-store';

/**
 * Supabase 세션 저장용 SecureStore 어댑터.
 * SecureStore는 값 하나당 약 2KB 제한이 있어 세션 JSON을 청크로 나눠 저장한다.
 * 토큰을 AsyncStorage에 두지 않기 위함 (docs/SECURITY.md).
 */
const CHUNK_SIZE = 1800;
const countKey = (key: string) => `${key}__chunks`;
const chunkKey = (key: string, i: number) => `${key}__${i}`;

async function removeChunks(key: string) {
  const count = Number((await SecureStore.getItemAsync(countKey(key))) ?? 0);
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i)))
  );
  await SecureStore.deleteItemAsync(countKey(key));
}

export const chunkedSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    const raw = await SecureStore.getItemAsync(countKey(key));
    if (raw === null) return null;
    const parts = await Promise.all(
      Array.from({ length: Number(raw) }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i)))
    );
    if (parts.some((p) => p === null)) return null;
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [''];
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  },
  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
  },
};
