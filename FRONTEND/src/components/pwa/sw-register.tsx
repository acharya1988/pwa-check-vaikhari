"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/pwabuilder-sw.js", {
          scope: "/",
        });
        // Optionally, update immediately
        reg.update?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("SW registration failed", err);
      }
    };

    register();
  }, []);

  return null;
}

