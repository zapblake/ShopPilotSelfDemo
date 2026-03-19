"use client";

import { useEffect, useState } from "react";

interface DiscoveredPage {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string | null;
  statusCode: number | null;
  pageType: string | null;
  score: number | null;
  reasoning: string | null;
  selected: boolean;
}

interface RenderedPageData {
  id: string;
  sourceUrl: string;
  previewPath: string;
  renderStatus: string;
  htmlBlobKey: string | null;
  screenshotBlobKey: string | null;
  extractedJson: { title?: string; metaDescription?: string } | null;
  errorMessage: string | null;
  renderStartedAt: string | null;
  renderFinishedAt: string | null;
  renderDurationMs: number | null;
}

interface WidgetConfigData {
  storeName: string | null;
  primaryColor: string | null;
  promptContext: string | null;
  mode: string;
}

interface JobData {
  id: string;
  submittedUrl: string;
  normalizedDomain: string;
  status: string;
  email: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  crawlRun: {
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    pageCount: number;
  } | null;
  discoveredPages: DiscoveredPage[];
  selectedPages: { id: string; url: string; pageType: string | null; title: string | null }[];
  renderedPages: RenderedPageData[];
  widgetConfig: WidgetConfigData | null;
  eventCount: number;
  lastEvent: { eventName: string; createdAt: string } | null;
}

const TERMINAL_STATUSES = new Set(["RENDER_COMPLETE", "PREVIEW_READY", "READY", "FAILED", "EXPIRED"]);

const VISUAL_STEPS = [
  { label: "Received", statuses: ["QUEUED"] },
  { label: "Scanning", statuses: ["CRAWLING"] },
  { label: "Analyzing", statuses: ["CLASSIFYING", "READY_FOR_RENDER"] },
  { label: "Building", statuses: ["RENDERING", "RENDER_COMPLETE"] },
  { label: "Ready", statuses: ["PREVIEW_READY", "READY"] },
];

function getVisualStepIndex(status: string): number {
  for (let i = 0; i < VISUAL_STEPS.length; i++) {
    if (VISUAL_STEPS[i].statuses.includes(status)) return i;
  }
  return -1;
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "QUEUED": return "Getting your store ready…";
    case "CRAWLING": return "Scanning your catalog pages…";
    case "CLASSIFYING": return "Analyzing your products…";
    case "READY_FOR_RENDER":
    case "RENDERING": return "Building your preview…";
    case "RENDER_COMPLETE": return "Building your preview…";
    case "PREVIEW_READY":
    case "READY": return "Your preview is ready! 🎉";
    case "FAILED": return "Something went wrong. We'll look into it.";
    default: return "Processing…";
  }
}

const pulseKeyframes = `
@keyframes pulse-orange {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,104,10,0.5); }
  50% { box-shadow: 0 0 0 10px rgba(245,104,10,0); }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export function JobStatusView({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/preview-jobs/${jobId}`);
        const data = await res.json();
        if (!active) return;

        if (!data.success) {
          setError(data.error?.message ?? "Failed to load job");
          return;
        }

        setJob(data.data);

        if (!TERMINAL_STATUSES.has(data.data.status)) {
          setTimeout(poll, 3000);
        }
      } catch {
        if (active) setError("Failed to fetch job status");
      }
    }

    poll();
    return () => { active = false; };
  }, [jobId]);

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "48px 40px",
    maxWidth: "560px",
    width: "100%",
  } as const;

  if (error) {
    return (
      <div style={{ ...card, textAlign: "center", color: "#ff6b6b" }}>
        <style>{pulseKeyframes}</style>
        <p style={{ fontSize: "16px" }}>{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ ...card, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
        <style>{pulseKeyframes}</style>
        <p style={{ fontSize: "16px" }}>Loading job status…</p>
      </div>
    );
  }

  const currentStep = getVisualStepIndex(job.status);
  const jobReady = job.status === "PREVIEW_READY" || job.status === "READY";
  const allRendersFailed = jobReady && job.renderedPages.length > 0 && job.renderedPages.every(p => p.renderStatus === "FAILED");
  const isFailed = job.status === "FAILED" || allRendersFailed;
  const isReady = jobReady && !allRendersFailed;
  const storeName = job.widgetConfig?.storeName || job.normalizedDomain;

  return (
    <div style={{ ...card, animation: "fade-in 0.4s ease-out" }}>
      <style>{pulseKeyframes}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <img
          src="/zapsight-wordmark.png"
          alt="ZapSight"
          style={{ height: "36px", width: "auto" }}
        />
      </div>

      {/* Store name badge */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <span style={{
          display: "inline-block",
          background: "linear-gradient(135deg,#f5680a,#ff8d29)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          padding: "6px 16px",
          borderRadius: "20px",
          letterSpacing: "0.02em",
        }}>{storeName}</span>
      </div>

      {/* Progress stepper */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "32px" }}>
        {VISUAL_STEPS.map((step, i) => {
          const isDone = !isFailed && currentStep > i;
          const isCurrent = !isFailed && currentStep === i;
          return (
            <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
              {/* Step circle + label */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "64px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  ...(isDone ? {
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "#fff",
                  } : isCurrent ? {
                    background: "linear-gradient(135deg,#f5680a,#ff8d29)",
                    color: "#fff",
                    animation: "pulse-orange 2s ease-in-out infinite",
                  } : {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }),
                }}>
                  {isDone ? "✓" : isCurrent ? "●" : "○"}
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  marginTop: "6px",
                  color: isDone ? "#22c55e" : isCurrent ? "#f5680a" : "rgba(255,255,255,0.25)",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase" as const,
                }}>{step.label}</span>
              </div>

              {/* Connector line */}
              {i < VISUAL_STEPS.length - 1 && (
                <div style={{
                  width: "24px",
                  height: "2px",
                  marginBottom: "18px",
                  background: isDone ? "linear-gradient(90deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.08)",
                  borderRadius: "1px",
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{
          fontSize: "18px",
          fontWeight: 500,
          color: isFailed ? "#ff6b6b" : isReady ? "#22c55e" : "rgba(255,255,255,0.7)",
          lineHeight: 1.5,
        }}>
          {isFailed ? "We hit a snag 😕" : getStatusMessage(job.status)}
        </p>
        {isFailed && (
          <p style={{ fontSize: "13px", color: "rgba(255,107,107,0.6)", marginTop: "8px" }}>
            {allRendersFailed
              ? "Your site uses bot protection — we'll show you Shop Pilot on a demo store instead."
              : job.errorMessage || "Please try again or see the demo store below."}
          </p>
        )}

      {/* Demo store fallback CTA when renders failed */}
      {isFailed && allRendersFailed && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a
            href={`/demo/${job.id}`}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#f5680a,#c9450d)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              padding: "13px 28px",
              borderRadius: "12px",
              textDecoration: "none",
              letterSpacing: "-0.2px",
            }}
          >
            See the Demo Store →
          </a>
        </div>
      )}
      </div>

      {/* CTA button when ready */}
      {isReady && (
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <a
            href={`/p/${job.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#f5680a,#ff8d29)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: "0 4px 20px rgba(245,104,10,0.3)",
            }}
          >
            View Your Preview →
          </a>
        </div>
      )}

      {/* Calendly link */}
      <div style={{ textAlign: "center" }}>
        <a
          href="https://calendly.com/blake-zapsight/30min"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.3)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "1px",
            transition: "color 0.2s ease",
          }}
        >
          Prefer a live demo? Book 15 minutes →
        </a>
      </div>
    </div>
  );
}
