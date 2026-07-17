const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const resolveApiBaseUrl = (): string => {
  if (ENV_API_BASE) return ENV_API_BASE.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/\/+$/, "");
  return "";
};

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

export const postJson = async <T = unknown>(path: string, payload: unknown): Promise<{ ok: boolean; data: T }> => {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, data: data as T };
};
