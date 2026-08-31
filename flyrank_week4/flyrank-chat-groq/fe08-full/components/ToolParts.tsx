"use client";

/**
 * ToolParts.tsx
 * ─────────────────────────────────────────────────────────────
 * Renders the four typed tool-part states for scoreLead and
 * sendInquiry, styled to match ChatInterface's coral dark theme
 * (#0a0e17 base, #111826 cards, coral/red gradient accent).
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
  hot: "#0891b2",
  warm: "#ffb154",
  cold: "rgba(255,255,255,0.35)",
};

const TIER_LABEL: Record<LeadScoreResult["tier"], string> = {
  hot: "Hot Lead",
  warm: "Warm Lead",
  cold: "Cold Lead",
};

const cardBase: React.CSSProperties = {
  background: "#111826",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 12.5,
  color: "rgba(224,244,250,0.88)",
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
          background: "#22d3ee",
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
        <span style={{ fontSize: 18, fontWeight: 700, color: "#e7f6fb" }}>{result.score}/100</span>
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
    <div style={{ ...cardBase, borderLeft: "3px solid #0891b2", background: "rgba(8,145,178,0.06)" }}>
      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#22d3ee" }}>Couldn&apos;t score this lead</p>
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
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(224,244,250,0.85)" }}>
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
            background: "linear-gradient(135deg, #22d3ee, #0891b2)",
            boxShadow: "0 3px 10px rgba(8,145,178,0.3)",
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

export function InquiryConfirmFailed() {
  return (
    <div style={{ ...cardBase, borderLeft: "3px solid #0891b2", background: "rgba(8,145,178,0.06)" }}>
      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#22d3ee" }}>
        Couldn&apos;t send that inquiry
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>
        Something went wrong on our end — feel free to email Murk directly at{" "}
        <span style={{ color: "rgba(103,232,249,0.8)" }}>murkchanna26@gmail.com</span> in the meantime.
      </p>
    </div>
  );
}

/**
 * FE-10: shows what the searchPortfolio (RAG) tool actually retrieved,
 * so it's visible on-screen that the assistant grounded its answer in
 * real data rather than the retrieval being an invisible black box.
 */
export function PortfolioSearchResult({
  found,
  results,
}: {
  found: boolean;
  results?: { topic: string; content: string }[];
}) {
  if (!found || !results || results.length === 0) {
    return (
      <div style={cardBase}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          🔍 Searched portfolio — no exact match found.
        </p>
      </div>
    );
  }
  return (
    <div style={cardBase}>
      <p style={{ margin: "0 0 6px", fontSize: 10.5, color: "rgba(103,232,249,0.7)", letterSpacing: "0.03em" }}>
        🔍 SEARCHED PORTFOLIO — {results.map((r) => r.topic).join(", ")}
      </p>
      {results.map((r, i) => (
        <p key={i} style={{ margin: i === 0 ? 0 : "4px 0 0", fontSize: 11.5, color: "rgba(240,235,255,0.75)" }}>
          {r.content}
        </p>
      ))}
    </div>
  );
}