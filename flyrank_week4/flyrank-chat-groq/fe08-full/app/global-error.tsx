"use client";

/**
 * app/global-error.tsx
 * ─────────────────────────────────────────────────────────────
 * FE-08: catches crashes in the root layout itself — the one case
 * app/error.tsx can't cover, since error.tsx renders inside the
 * layout. Must render its own <html>/<body> since the real layout
 * may be the thing that's broken.
 * ─────────────────────────────────────────────────────────────
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#1a1825",
          color: "rgba(240,235,255,0.85)",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600, color: "#f0eeff" }}>
          The app failed to load
        </p>
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
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
