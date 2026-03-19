"use client";

import { useEffect, useState, Suspense } from "react";

interface JobSummary {
  id: string;
  submittedUrl: string;
  normalizedDomain: string;
  status: string;
  email: string | null;
  createdAt: string;
  crawlRun: { status: string; pageCount: number } | null;
  renderedPageCount: number;
  renderStatusSummary: string;
  eventCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-gray-400",
  QUEUED: "text-gray-400",
  CRAWLING: "text-blue-400",
  CLASSIFYING: "text-yellow-400",
  READY_FOR_RENDER: "text-green-400",
  RENDERING: "text-purple-400",
  RENDER_COMPLETE: "text-green-400",
  PREVIEW_READY: "text-emerald-400",
  READY: "text-green-400",
  FAILED: "text-red-400",
  EXPIRED: "text-gray-500",
};

function AdminPreviewJobsContent() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/preview-jobs");
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Unauthorized");
      } else {
        setJobs(data.data);
      }
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function deleteJob(id: string, domain: string) {
    if (!confirm(`Delete job for ${domain}?\n\nThis removes all crawl data, renders, and events. Cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/preview-jobs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch {
      alert("Delete failed — check console");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0f0f13" }}>
      <p style={{ color: "#666" }}>Loading...</p>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0f0f13" }}>
      <div style={{ background: "#2d1111", border: "1px solid #7f1d1d", borderRadius: "12px", padding: "24px", color: "#f87171" }}>{error}</div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0f0f13", padding: "40px 24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "white", margin: 0 }}>Preview Jobs</h1>
            <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0" }}>{jobs.length} jobs</p>
          </div>
          <button
            onClick={loadJobs}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", padding: "8px 16px", color: "#ccc", fontSize: "13px",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Domain", "Email", "Status", "Created", "Pages", "Rendered", "Events", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#666", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: deleting === job.id ? 0.4 : 1, transition: "opacity 0.2s" }}
                >
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ color: "white", fontWeight: 500 }}>{job.normalizedDomain}</div>
                    <div style={{ color: "#555", fontSize: "11px", fontFamily: "monospace" }}>{job.id.slice(0, 10)}…</div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#888" }}>{job.email || <span style={{ color: "#444" }}>—</span>}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontWeight: 600 }} className={STATUS_COLORS[job.status]}>{job.status}</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#666" }}>
                    {new Date(job.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#666" }}>{job.crawlRun?.pageCount ?? "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#666" }}>
                    {job.renderedPageCount > 0 ? `${job.renderedPageCount} (${job.renderStatusSummary})` : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#666" }}>{job.eventCount || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <a
                        href={`/preview-jobs/${job.id}`}
                        style={{ color: "#60a5fa", fontSize: "12px", textDecoration: "none", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(96,165,250,0.25)", background: "rgba(96,165,250,0.08)" }}
                      >
                        View
                      </a>
                      {(job.status === "PREVIEW_READY" || job.status === "READY") && (
                        <a
                          href={`/p/${job.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#34d399", fontSize: "12px", textDecoration: "none", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.08)" }}
                        >
                          Preview
                        </a>
                      )}
                      <button
                        onClick={() => deleteJob(job.id, job.normalizedDomain)}
                        disabled={deleting === job.id}
                        style={{
                          color: "#f87171", fontSize: "12px", padding: "4px 10px", borderRadius: "6px",
                          border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)",
                          cursor: deleting === job.id ? "wait" : "pointer", fontFamily: "inherit",
                        }}
                      >
                        {deleting === job.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#555" }}>No jobs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default function AdminPreviewJobsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0f0f13" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    }>
      <AdminPreviewJobsContent />
    </Suspense>
  );
}
