import { Platform } from 'react-native';
import { buildApiUrl, postJson, getToken } from '../lib/api';

/**
 * Base response type that all API responses must extend
 */
export interface ApiBaseResponse {
  success: boolean;
  error?: string;
}

/**
 * GET request with auth headers and error handling
 */
export async function getApi<T extends ApiBaseResponse>(
  endpoint: string
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (Platform.OS !== 'web') {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...(Platform.OS === 'web' ? { credentials: 'include' as const } : {}),
    headers,
  });

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

/**
 * POST request with JSON body (wrapper around postJson)
 */
export async function postApi<T extends ApiBaseResponse>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data: T }> {
  return postJson<T>(endpoint, payload);
}

/**
 * Request with custom options (for PUT, DELETE, or special cases)
 */
export async function fetchApiCustom<T extends ApiBaseResponse>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (Platform.OS !== 'web') {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    ...(Platform.OS === 'web' ? { credentials: 'include' as const } : {}),
    headers,
  });

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}