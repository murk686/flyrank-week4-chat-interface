"use client";

/**
 * MessageSkeleton.tsx
 * ─────────────────────────────────────────────────────────────
 * FE-08: replaces a bare 3-dot spinner with a skeleton shaped like
 * an actual response — a few lines of varying width. This matters
 * because a skeleton that's a different size than the real content
 * causes a layout jump the instant text starts streaming in (bad
 * CLS). Three lines at realistic widths keeps the handoff smooth.
 * ─────────────────────────────────────────────────────────────
 */

export default function MessageSkeleton() {
  const widths = ["78%", "92%", "55%"];
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
      aria-label="Generating response"
      role="status"
    >
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            height: 11,
            width: w,
            borderRadius: 5,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)",
            backgroundSize: "400% 100%",
            animation: "skeleton-shimmer 1.4s ease infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
