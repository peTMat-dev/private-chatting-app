"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { postJson } from "../../lib/api";
import { t, getLang, type LangCode } from "../../lib/i18n";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [lang, setLang] = useState<LangCode>("en");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize language from cookies/localStorage
  useEffect(() => {
    setLang(getLang());
  }, []);

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
    const tr = t(lang);
    if (!token) {
      showToast({ title: tr.resetFailed, body: tr.tokenMissing });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ title: tr.resetFailed, body: tr.passwordsMustMatch });
      return;
    }

    setLoading(true);
    try {
      const { ok, data } = await postJson("/auth/reset-password", {
        token,
        password,
      });
      if (!ok || !data.success) {
        const detail = data.errors?.[0] ?? data.error ?? tr.unableToReset;
        showToast({ title: tr.resetFailed, body: detail });
        return;
      }
      showToast({ title: tr.passwordUpdated, body: data.message ?? tr.signInNewPassword });
      setTimeout(() => router.push("/"), 1200);
    } catch (error) {
      showToast({ title: tr.resetFailed, body: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const tr = t(lang);

  return (
    <div className="mobile-auth-screen">
      <section className="auth-card">
        <h2>{tr.resetPassword}</h2>
        {!token && (
          <p className="hero-copy">{tr.tokenMissing}. {tr.sendResetLinkPrompt}</p>
        )}
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3 mt-3">
          <div>
            <label htmlFor="reset-pass" className="auth-label">
              {tr.newPassword}
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
              {tr.confirmPassword}
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
