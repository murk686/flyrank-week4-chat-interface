"use client";

/**
 * app/error.tsx
 * ─────────────────────────────────────────────────────────────
 * FE-08: Next.js route-level error boundary. Catches crashes in
 * rendering/route code that happen OUTSIDE the chat stream itself
 * (e.g. a thrown error during a re-render). The chat's own
 * mid-stream failures are handled separately by useChat's `error`
 * object in ChatInterface — this boundary is the last-resort net
 * for anything that gets past that.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where you'd send to an error-tracking
    // service. Logged here so it's visible during sabotage testing.
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#1a1825",
        color: "rgba(240,235,255,0.85)",
        fontFamily: "var(--font-sans)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: "white",
          boxShadow: "0 8px 24px rgba(255,71,87,0.3)",
        }}
      >
        !
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#f0eeff", marginBottom: 6 }}>
          Something broke on this page
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 360 }}>
          This isn&apos;t a chat error — it&apos;s a page-level crash. Reloading the page
          usually fixes it.
        </p>
      </div>
      <button
        onClick={reset}
        style={{
          padding: "9px 20px",
          borderRadius: 10,
          cursor: "pointer",
          background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
          border: "none",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 4px 14px rgba(255,71,87,0.3)",
        }}
      >
        Try again
      </button>
    </div>
  );
}
