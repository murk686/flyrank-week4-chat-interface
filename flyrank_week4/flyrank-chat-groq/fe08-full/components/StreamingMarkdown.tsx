"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function closeOpenFences(text: string): string {
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) return text + "\n```";
  return text;
}

interface Props {
  content: string;
  isStreaming?: boolean;
}

export default function StreamingMarkdown({ content, isStreaming }: Props) {
  const safeContent = isStreaming ? closeOpenFences(content) : content;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const isBlock = className?.startsWith("language-");
          const lang = className?.replace("language-", "") ?? "";
          if (isBlock) {
            return (
              <div style={{ margin: "10px 0 0", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                {lang && (
                  <div style={{ padding: "4px 12px", background: "rgba(0,0,0,0.3)", fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(255,150,130,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {lang}
                  </div>
                )}
                <pre style={{ background: "rgba(0,0,0,0.3)", padding: "10px 12px", overflowX: "auto" }}>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#ff9a8b", lineHeight: 1.8 }}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          }
          return (
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#ff9a8b", background: "rgba(255,107,91,0.08)", padding: "1px 6px", borderRadius: 4 }}>
              {children}
            </code>
          );
        },
        p({ children }) { return <p style={{ marginBottom: 10, lineHeight: 1.65 }}>{children}</p>; },
        ul({ children }) { return <ul style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ul>; },
        ol({ children }) { return <ol style={{ paddingLeft: 18, marginBottom: 10 }}>{children}</ol>; },
        li({ children }) { return <li style={{ marginBottom: 4, lineHeight: 1.6 }}>{children}</li>; },
        h1({ children }) { return <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: "rgba(240,235,255,0.95)" }}>{children}</h1>; },
        h2({ children }) { return <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "rgba(240,235,255,0.95)" }}>{children}</h2>; },
        h3({ children }) { return <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "rgba(240,235,255,0.95)" }}>{children}</h3>; },
        strong({ children }) { return <strong style={{ fontWeight: 600, color: "rgba(240,235,255,0.95)" }}>{children}</strong>; },
        blockquote({ children }) {
          return (
            <blockquote style={{ borderLeft: "2px solid rgba(255,107,91,0.4)", paddingLeft: 12, margin: "8px 0", color: "rgba(240,235,255,0.5)", fontStyle: "italic" }}>
              {children}
            </blockquote>
          );
        },
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
}
