"use client";

/**
 * ChatErrorBanner.tsx
 * ─────────────────────────────────────────────────────────────
 * FE-08: rendered when useChat's `error` object is set — i.e. the
 * request to /api/chat failed or the stream broke mid-response.
 * Retry calls regenerate(), which re-sends only the last user
 * message (AI SDK removes the failed assistant response and retries
 * from there) — NOT the whole conversation. `retrying` guards
 * against double-clicks firing two requests at once.
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from "react";

export default function ChatErrorBanner({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (retrying) return; // guard against double-click firing two requests
    setRetrying(true);
    onRetry();
    // Reset shortly after — if the retry itself fails, `error` will be
    // set again by useChat and this banner re-renders fresh anyway.
    setTimeout(() => setRetrying(false), 1200);
  };

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(255,71,87,0.08)",
        border: "1px solid rgba(255,71,87,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>⚠</span>
        <span style={{ fontSize: 12.5, color: "rgba(255,180,170,0.9)" }}>
          Something went wrong. Your message wasn&apos;t lost — try again.
        </span>
      </div>
      <button
        onClick={handleRetry}
        disabled={retrying}
        style={{
          flexShrink: 0,
          padding: "6px 14px",
          borderRadius: 8,
          border: "none",
          cursor: retrying ? "default" : "pointer",
          background: retrying ? "rgba(255,107,91,0.3)" : "linear-gradient(135deg, #ff6b5b, #ff4757)",
          color: "white",
          fontSize: 11.5,
          fontWeight: 600,
        }}
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
