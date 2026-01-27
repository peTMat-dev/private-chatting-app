"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiResponse = {
  success: boolean;
  message?: string;
  error?: string;
  errors?: string[];
};

type ToastMessage = {
  title: string;
  body: string;
};

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const resolveApiBaseUrl = (): string => {
  if (ENV_API_BASE) {
    return ENV_API_BASE.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
};

const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

const postJson = async (
  path: string,
  payload: unknown
): Promise<{ ok: boolean; data: ApiResponse }> => {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as ApiResponse;
  return { ok: response.ok, data };
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const formDisabled = useMemo(() => {
    if (loading) return true;
    if (!token) return true;
    if (!password || password.length < 6) return true;
    if (password !== confirmPassword) return true;
    return false;
  }, [loading, token, password, confirmPassword]);

  const showToast = (message: ToastMessage) => setToast(message);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      showToast({ title: "Reset failed", body: "Token is missing" });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ title: "Reset failed", body: "Passwords must match" });
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await postJson("/auth/reset-password", {
        token,
        password,
      });
      if (!ok || !data.success) {
        const detail = data.errors?.[0] ?? data.error ?? "Unable to reset password";
        showToast({ title: "Reset failed", body: detail });
        return;
      }
      showToast({ title: "Password updated", body: data.message ?? "Sign in with your new password" });
      setTimeout(() => router.push("/"), 1200);
    } catch (error) {
      showToast({ title: "Reset failed", body: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-auth-screen">
      <section className="auth-card">
        <h2>Reset Password</h2>
        {!token && (
          <p className="hero-copy">This link is missing a token. Request a new password reset email and try again.</p>
        )}
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3 mt-3">
          <div>
            <label htmlFor="reset-pass" className="auth-label">
              New password
            </label>
            <input
              id="reset-pass"
              type="password"
              className="auth-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="reset-confirm" className="auth-label">
              Confirm password
            </label>
            <input
              id="reset-confirm"
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="auth-btn" disabled={formDisabled}>
            {loading ? "Updating" : "Reset password"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => router.push("/")}>
            Back to sign in
          </button>
        </form>
      </section>

      {toast && (
        <div className="toast-stack">
          <div className="toast-green">
            <strong>{toast.title}</strong>
            <span>{toast.body}</span>
          </div>
        </div>
      )}
    </div>
  );
}
