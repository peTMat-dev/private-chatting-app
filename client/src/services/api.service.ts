import { buildApiUrl, postJson } from "../lib/api";

/**
 * Base response type that all API responses must extend
 */
export interface ApiBaseResponse {
  success: boolean;
  error?: string;
}

/**
 * GET request with standard headers and error handling
 * @param endpoint API endpoint (e.g., "/chats", "/contacts")
 * @returns Parsed JSON response
 * @throws Error if response is not ok, success is false, or JSON parsing fails
 */
export async function getApi<T extends ApiBaseResponse>(
  endpoint: string
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const res = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

/**
 * POST request with JSON body (wrapper around existing postJson)
 * @param endpoint API endpoint (e.g., "/contacts/remove")
 * @param payload Request body
 * @returns Object with ok status and parsed data
 *
 * Note: Unlike getApi/fetchApiCustom, this returns { ok, data } instead of throwing.
 * This maintains compatibility with the existing postJson pattern used in auth.service.ts.
 */
export async function postApi<T extends ApiBaseResponse>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data: T }> {
  return postJson<T>(endpoint, payload);
}

/**
 * Request with custom options (for PUT, DELETE, or special cases)
 * @param endpoint API endpoint (e.g., "/settings", "/chats/123/messages/456")
 * @param options Fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response
 * @throws Error if response is not ok, success is false, or JSON parsing fails
 */
export async function fetchApiCustom<T extends ApiBaseResponse>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}