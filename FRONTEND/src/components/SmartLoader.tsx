"use client";
import React from 'react';

type Props = {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delayMs?: number; // delay before showing fallback
  minVisibleMs?: number; // keep fallback visible at least this long
};

export default function SmartLoader({
  loading,
  children,
  fallback = <div className="animate-pulse text-sm text-muted-foreground">Loading…</div>,
  delayMs = 120,
  minVisibleMs = 240,
}: Props) {
  const [showFallback, setShowFallback] = React.useState(false);
  const shownAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let t: any;
    if (loading) {
      t = setTimeout(() => {
        setShowFallback(true);
        shownAtRef.current = performance.now();
      }, delayMs);
    } else {
      const elapsed = shownAtRef.current ? performance.now() - shownAtRef.current : 0;
      const remain = Math.max(0, minVisibleMs - elapsed);
      t = setTimeout(() => {
        setShowFallback(false);
        shownAtRef.current = null;
      }, remain);
    }
    return () => clearTimeout(t);
  }, [loading, delayMs, minVisibleMs]);

  if (loading || showFallback) return <>{fallback}</>;
  return <>{children}</>;
}

