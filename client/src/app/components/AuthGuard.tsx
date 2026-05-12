"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "../../lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch(buildApiUrl("/auth/me"), { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.push("/");
        } else {
          setAuthenticated(true);
        }
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  if (!authenticated) return null;

  return <>{children}</>;
}
