"use client";

/**
 * ChatInterface.tsx — Coral Dark Theme
 * ─────────────────────────────────────────────────────────────
 * Design: Dark purple/slate (#1a1825) base with coral/red accent
 * Inspired by modern messenger UI — clean bubbles, rounded corners,
 * gradient send button, glowing avatar.
 *
 * FE-06 requirements:
 *   - Token-by-token streaming via useChat (AI SDK v7)
 *   - Stop button aborts mid-stream, partial message persists
 *   - Multi-turn conversation state
 *   - Auto-scroll with scroll-up release + jump to latest
 *   - Mobile friendly fixed input bar
 * ─────────────────────────────────────────────────────────────
 */

import { useChat } from "@ai-sdk/react";
import { isTextUIPart, type UIMessage, DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import StreamingMarkdown from "./StreamingMarkdown";
import ThinkingIndicator from "./ThinkingIndicator";
import {
  ScoreLeadPending,
  LeadScoreCard,
  LeadScoreError,
  InquiryConfirmPrompt,
  InquiryConfirmSent,
  InquiryConfirmDeclined,
} from "./ToolParts";
import type { LeadScoreResult } from "@/lib/tools";
import { Send, Square, ArrowDown } from "lucide-react";

const SCROLL_THRESHOLD = 80;

function getTextContent(msg: UIMessage): string {
  return msg.parts.filter(isTextUIPart).map((p) => p.text).join("");
}

function isStreamingPart(msg: UIMessage): boolean {
  return msg.parts.some((p) => isTextUIPart(p) && p.state === "streaming");
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatInterface() {
  const { messages, sendMessage, status, stop, addToolOutput } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => { setMounted(true); }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAtBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    isUserScrolledRef.current = false;
    setShowJumpToBottom(false);
  }, []);

  const handleScroll = useCallback(() => {
    if (isAtBottom()) {
      isUserScrolledRef.current = false;
      setShowJumpToBottom(false);
    } else {
      isUserScrolledRef.current = true;
      setShowJumpToBottom(true);
    }
  }, [isAtBottom]);

  useEffect(() => {
    if (!isUserScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
    }
  }, [messages]);

  const onSubmit = () => {
    if (!input.trim() || isLoading) return;
    isUserScrolledRef.current = false;
    setShowJumpToBottom(false);
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit();
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [input]);

  const lastMessage = messages[messages.length - 1];
  const isThinking =
    status === "submitted" ||
    (status === "streaming" && lastMessage?.role === "assistant" && getTextContent(lastMessage).length === 0);

  const suggestedPrompts = ["Explain streaming SSE", "Write a React hook", "What is RAG?"];

  /**
   * FE-07: renders every non-text part of a message — i.e. the tool
   * calls — as its own card beneath the text bubble. Switches on
   * part.type first (which tool), then part.state (which of the four
   * typed states: input-streaming, input-available, output-available,
   * output-error), so each state gets a visually distinct treatment
   * instead of a JSON dump.
   */
  function renderToolParts(msg: UIMessage) {
    return msg.parts.map((part, i) => {
      if (part.type === "tool-scoreLead") {
        const callId = part.toolCallId;
        switch (part.state) {
          case "input-streaming":
            return <ScoreLeadPending key={callId} label="Scoring lead…" />;
          case "input-available": {
            const input = part.input as { interest: string; role: string };
            return (
              <ScoreLeadPending
                key={callId}
                label={`Evaluating a ${input.interest} inquiry from a ${input.role}…`}
              />
            );
          }
          case "output-available":
            return <LeadScoreCard key={callId} result={part.output as LeadScoreResult} />;
          case "output-error":
            return <LeadScoreError key={callId} message={part.errorText} />;
          default:
            return null;
        }
      }

      if (part.type === "tool-sendInquiry") {
        const callId = part.toolCallId;
        switch (part.state) {
          case "input-streaming":
            return <ScoreLeadPending key={callId} label="Preparing inquiry…" />;
          case "input-available":
            return (
              <InquiryConfirmPrompt
                key={callId}
                summary={(part.input as { summary: string }).summary}
                onConfirm={() =>
                  addToolOutput({ tool: "sendInquiry", toolCallId: callId, output: "confirmed" })
                }
                onDecline={() =>
                  addToolOutput({ tool: "sendInquiry", toolCallId: callId, output: "declined" })
                }
              />
            );
          case "output-available":
            return part.output === "confirmed" ? (
              <InquiryConfirmSent key={callId} />
            ) : (
              <InquiryConfirmDeclined key={callId} />
            );
          case "output-error":
            return <LeadScoreError key={callId} message={part.errorText ?? "Couldn't send that inquiry."} />;
          default:
            return null;
        }
      }

      return null;
    });
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#1a1825", color: "rgba(240,235,255,0.85)",
      fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 55% 35% at 80% 15%, rgba(255,100,80,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 45% 30% at 20% 85%, rgba(120,100,220,0.07) 0%, transparent 55%)
        `,
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 2, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px",
        background: "rgba(26,24,37,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "white",
          boxShadow: "0 4px 14px rgba(255,71,87,0.3)",
        }}>✦</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0eeff" }}>FlyRank AI</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
            llama-3.3-70b · streaming chat
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isLoading ? "rgba(255,107,91,0.7)" : "#4cd964",
            boxShadow: isLoading ? "0 0 6px rgba(255,107,91,0.5)" : "0 0 6px rgba(76,217,100,0.5)",
            transition: "all 0.3s",
          }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            {status === "submitted" ? "thinking" : status === "streaming" ? "streaming" : "online"}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: "auto", padding: "20px",
          paddingBottom: "110px", zIndex: 2, position: "relative",
        }}
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 20, textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "white",
              boxShadow: "0 8px 24px rgba(255,71,87,0.3)",
            }}>✦</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#f0eeff", marginBottom: 6 }}>
                Start a conversation
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                Responses stream token by token
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 }}>
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  style={{
                    padding: "7px 16px", borderRadius: 20, cursor: "pointer",
                    background: "rgba(255,107,91,0.08)",
                    border: "1px solid rgba(255,107,91,0.2)",
                    color: "rgba(255,150,130,0.8)", fontSize: 12,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,107,91,0.15)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,91,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,107,91,0.08)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,91,0.2)";
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Date divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>Today</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>

            {messages.map((msg, i) => {
              const isAssistant = msg.role === "assistant";
              const isLast = i === messages.length - 1;
              const textContent = getTextContent(msg);
              const streaming = isLast && isAssistant && isStreamingPart(msg);
              const thinking = isLast && isAssistant && textContent.length === 0 &&
                (status === "submitted" || status === "streaming");

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex", gap: 10,
                    alignItems: "flex-end",
                    flexDirection: isAssistant ? "row" : "row-reverse",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600,
                    ...(isAssistant ? {
                      background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
                      color: "white",
                      boxShadow: "0 3px 10px rgba(255,71,87,0.25)",
                    } : {
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)",
                    }),
                  }}>
                    {isAssistant ? "F" : "M"}
                  </div>

                  {/* Bubble group */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 4,
                    maxWidth: "72%",
                    alignItems: isAssistant ? "flex-start" : "flex-end",
                  }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: 16,
                      fontSize: 13,
                      lineHeight: 1.65,
                      ...(isAssistant ? {
                        background: "#242133",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(240,235,255,0.85)",
                        borderBottomLeftRadius: 4,
                      } : {
                        background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
                        color: "white",
                        borderBottomRightRadius: 4,
                        boxShadow: "0 4px 16px rgba(255,71,87,0.2)",
                      }),
                    }}>
                      {isAssistant ? (
                        thinking ? (
                          <ThinkingIndicator />
                        ) : (
                          <>
                            <StreamingMarkdown content={textContent} isStreaming={streaming} />
                            {streaming && (
                              <span style={{
                                display: "inline-block", width: 2, height: 13,
                                background: "#ff6b5b", marginLeft: 2,
                                animation: "blink 1s infinite",
                                verticalAlign: "text-bottom",
                              }} />
                            )}
                          </>
                        )
                      ) : (
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {textContent || msg.parts.map(p => "text" in p ? (p as { text: string }).text : "").join("")}
                        </span>
                      )}
                    </div>

                    {/* FE-07: tool call cards (scoreLead / sendInquiry) */}
                    {isAssistant && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                        {renderToolParts(msg)}
                      </div>
                    )}

                    <div style={{
                      fontSize: 10, color: "rgba(255,255,255,0.2)",
                      padding: "0 4px",
                      textAlign: isAssistant ? "left" : "right",
                    }}>
                      {formatTime()}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Standalone thinking bubble if no assistant message yet */}
            {isThinking && lastMessage?.role !== "assistant" && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #ff6b5b, #ff4757)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, color: "white",
                  boxShadow: "0 3px 10px rgba(255,71,87,0.25)",
                }}>F</div>
                <div style={{
                  padding: "12px 16px",
                  background: "#242133",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, borderBottomLeftRadius: 4,
                }}>
                  <ThinkingIndicator />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Jump to bottom */}
      {showJumpToBottom && (
        <div style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          <button
            onClick={() => scrollToBottom()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20, cursor: "pointer",
              background: "#242133",
              border: "1px solid rgba(255,107,91,0.25)",
              color: "rgba(255,150,130,0.8)", fontSize: 11,
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}
          >
            <ArrowDown size={12} /> Jump to latest
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "rgba(26,24,37,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
        padding: "14px 20px 16px",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message…"
              style={{
                flex: 1, resize: "none", outline: "none",
                background: "#242133",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "10px 16px",
                fontSize: 13, color: "rgba(240,235,255,0.85)",
                fontFamily: "var(--font-sans)", lineHeight: 1.6,
                minHeight: 44, maxHeight: 140,
                caretColor: "#ff6b5b",
              }}
            />

            {isLoading ? (
              <button
                onClick={stop}
                aria-label="Stop generation"
                style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0, cursor: "pointer",
                  background: "rgba(255,71,87,0.15)",
                  border: "1px solid rgba(255,71,87,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#ff6b5b",
                }}
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={!mounted || !input.trim()}
                aria-label="Send message"
                style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  cursor: mounted && input.trim() ? "pointer" : "not-allowed",
                  background: mounted && input.trim()
                    ? "linear-gradient(135deg, #ff6b5b, #ff4757)"
                    : "rgba(255,255,255,0.05)",
                  border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: mounted && input.trim() ? "white" : "rgba(255,255,255,0.2)",
                  boxShadow: mounted && input.trim() ? "0 4px 14px rgba(255,71,87,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <Send size={15} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "rgba(255,107,91,0.4)" }}>⌘↵</span> send
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "rgba(255,107,91,0.4)" }}>esc</span> stop
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
        textarea:focus { border-color: rgba(255,107,91,0.3) !important; }
      `}</style>
    </div>
  );
}