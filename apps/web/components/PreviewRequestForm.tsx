"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function PreviewRequestForm() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/preview-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message ?? "Something went wrong");
        return;
      }

      window.location.href = `/preview-jobs/${data.data.jobId}`;
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "14px 16px 14px 44px",
    fontSize: "15px",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    pointerEvents: "none",
    userSelect: "none",
    opacity: 0.6,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* URL input */}
      <div style={{ position: "relative" }}>
        <span style={iconStyle}>🏪</span>
        <input
          type="text"
          required
          placeholder="yourstore.com or yourstore.myshopify.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Email input */}
      <div style={{ position: "relative" }}>
        <span style={iconStyle}>✉️</span>
        <input
          type="email"
          required
          placeholder="your@email.com — we'll send you the link"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !url || !email}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "12px",
          border: "none",
          background: submitting || !url || !email
            ? "rgba(255,107,53,0.4)"
            : "linear-gradient(135deg, #ff6b35 0%, #ff3d7f 100%)",
          color: "white",
          fontSize: "15px",
          fontWeight: 700,
          cursor: submitting || !url || !email ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          letterSpacing: "-0.2px",
          transition: "opacity 0.15s",
        }}
      >
        {submitting ? "Building your preview..." : "See My Store with AI →"}
      </button>

      {error && (
        <p style={{ fontSize: "13px", color: "#f87171", textAlign: "center", margin: 0 }}>
          {error}
        </p>
      )}
    </form>
  );
}
