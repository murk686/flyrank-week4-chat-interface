"use client";

/**
 * ToolParts.tsx
 * ─────────────────────────────────────────────────────────────
 * Renders the four typed tool-part states for scoreLead and
 * sendInquiry, styled to match ChatInterface's coral dark theme
 * (#1a1825 base, #242133 cards, coral/red gradient accent).
 *
 * Each of the four states answers a different question:
 *   input-streaming  → "what is it doing?"
 *   input-available  → "with what input?"
 *   output-available → "what came back?"
 *   output-error     → "what went wrong?"
 * ─────────────────────────────────────────────────────────────
 */

import type { LeadScoreResult } from "@/lib/tools";

const TIER_COLOR: Record<LeadScoreResult["tier"], string> = {
  hot: "#ff4757",
  warm: "#ffb154",
  cold: "rgba(255,255,255,0.35)",
};

const TIER_LABEL: Record<LeadScoreResult["tier"], string> = {
  hot: "Hot Lead",
  warm: "Warm Lead",
  cold: "Cold Lead",
};

const cardBase: React.CSSProperties = {
  background: "#242133",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 12.5,
  color: "rgba(240,235,255,0.85)",
};

const mutedText: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.35)",
};

/* ---------- scoreLead states ---------- */

export function ScoreLeadPending({ label }: { label: string }) {
  return (
    <div style={{ ...mutedText, display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#ff6b5b",
          animation: "tdp 1s infinite",
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}

export function LeadScoreCard({ result }: { result: LeadScoreResult }) {
  const color = TIER_COLOR[result.tier];
  return (
    <div style={{ ...cardBase, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color }}>
          {TIER_LABEL[result.tier]}
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#f0eeff" }}>{result.score}/100</span>
      </div>

      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 10 }}>
        <div
          style={{
            height: "100%",
            width: `${result.score}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
        {result.reasons.map((reason, i) => (
          <li key={i} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LeadScoreError({ message }: { message: string }) {
  return (
    <div style={{ ...cardBase, borderLeft: "3px solid #ff4757", background: "rgba(255,71,87,0.06)" }}>
      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#ff6b5b" }}>Couldn&apos;t score this lead</p>
      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{message}</p>
    </div>
  );
}

/* ---------- sendInquiry states ---------- */

export function InquiryConfirmPrompt({
  summary,
  onConfirm,
  onDecline,
}: {
  summary: string;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <div style={cardBase}>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(240,235,255,0.8)" }}>
        Send this inquiry to Murk? <span style={{ color: "rgba(255,255,255,0.5)" }}>&ldquo;{summary}&rdquo;</span>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onConfirm}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 11.5,
            fontWeight: 600,
            color: "white",
            background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
            boxShadow: "0 3px 10px rgba(255,71,87,0.3)",
          }}
        >
          Yes, send it
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            fontSize: 11.5,
            color: "rgba(255,255,255,0.6)",
            background: "transparent",
          }}
        >
          No, cancel
        </button>
      </div>
    </div>
  );
}

export function InquiryConfirmSent() {
  return (
    <div style={{ ...cardBase, borderLeft: "3px solid #4cd964" }}>
      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#4cd964" }}>Inquiry sent ✓</p>
      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>
        Murk will follow up directly — thanks for reaching out.
      </p>
    </div>
  );
}

export function InquiryConfirmDeclined() {
  return (
    <div style={cardBase}>
      <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>No problem — nothing was sent.</p>
    </div>
  );
}
