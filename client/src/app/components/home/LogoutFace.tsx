"use client";

import { type Translations } from "../../../lib/i18n";

type Props = {
  handleLogout: () => void;
  goUp: () => void;
  tr: Translations;
};

export default function HomeLogoutFace({ handleLogout, goUp, tr }: Props) {
  return (
          <section className="cube-face cube-face-top">
            <article className="auth-card cube-face-panel">
              <h2>{tr.logout}</h2>
              <p className="hero-copy">
                {tr.logoutPrompt}
              </p>
              <button
                className="auth-btn"
                type="button"
                onClick={handleLogout}
              >
                {tr.logOut}
              </button>
              <button
                className="ghost-btn mt-3"
                type="button"
                onClick={goUp}
              >
                {tr.cancel}
              </button>
            </article>
          </section>
  );
}