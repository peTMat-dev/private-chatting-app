import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ENV_API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const TOKEN_KEY = 'cubcha_session';

const localStorageAvailable = (): boolean =>
  Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const setToken = async (token: string): Promise<void> => {
  if (localStorageAvailable()) {
    // Web builds live on a different site than the API, where third-party
    // cookies are commonly blocked — persist the Bearer token instead.
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  if (localStorageAvailable()) {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearToken = async (): Promise<void> => {
  if (localStorageAvailable()) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

const resolveApiBaseUrl = (): string => {
  if (ENV_API_BASE) return ENV_API_BASE.replace(/\/+$/, '');
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
};

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

export const postJson = async <T = unknown>(
  path: string,
  payload: unknown
): Promise<{ ok: boolean; data: T }> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = await getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    ...(Platform.OS === 'web' ? { credentials: 'include' as const } : {}),
    headers,
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, data: data as T };
};