"use client";

export default function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2" aria-label="Generating response" role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "rgba(255,107,91,0.5)",
            display: "inline-block",
            animation: "tdp 1s infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes tdp {
          0%,80%,100% { transform: scale(1); opacity: 0.4; }
          40% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
