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
}

const STEPS = ["QUEUED", "CRAWLING", "CLASSIFYING", "READY_FOR_RENDER", "RENDERING", "RENDER_COMPLETE", "PREVIEW_READY"] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-200 text-gray-700",
  QUEUED: "bg-gray-200 text-gray-700",
  CRAWLING: "bg-blue-100 text-blue-700",
  CLASSIFYING: "bg-yellow-100 text-yellow-700",
  READY_FOR_RENDER: "bg-green-100 text-green-700",
  RENDERING: "bg-purple-100 text-purple-700",
  RENDER_COMPLETE: "bg-green-100 text-green-700",
  PREVIEW_READY: "bg-emerald-100 text-emerald-700",
  READY: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-200 text-gray-500",
};

const TERMINAL_STATUSES = new Set(["RENDER_COMPLETE", "PREVIEW_READY", "READY", "FAILED", "EXPIRED"]);

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

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center text-gray-500">Loading job status...</div>
    );
  }

  const currentStep = STEPS.indexOf(job.status as typeof STEPS[number]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Preview Job</h1>
        <p className="mt-1 text-sm text-gray-500">
          ID: <code className="rounded bg-gray-100 px-1.5 py-0.5">{job.id}</code>
        </p>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[job.status] ?? "bg-gray-100"}`}>
          {job.status}
        </span>
        <span className="text-sm text-gray-500">
          {job.normalizedDomain}
        </span>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-8 items-center rounded-full px-3 text-xs font-medium ${
                i <= currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              } ${job.status === "FAILED" && i <= currentStep ? "bg-red-500 text-white" : ""}`}
            >
              {step}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 ${i < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Created:</span>{" "}
          {new Date(job.createdAt).toLocaleString()}
        </div>
        {job.completedAt && (
          <div>
            <span className="text-gray-500">Completed:</span>{" "}
            {new Date(job.completedAt).toLocaleString()}
          </div>
        )}
        <div>
          <span className="text-gray-500">URL:</span>{" "}
          {job.submittedUrl}
        </div>
      </div>

      {/* Error */}
      {job.status === "FAILED" && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="font-medium text-red-700">Job Failed</p>
          <p className="mt-1 text-sm text-red-600">
            {job.errorMessage ?? "Unknown error"}
            {job.errorCode && (
              <span className="ml-2 text-red-400">({job.errorCode})</span>
            )}
          </p>
        </div>
      )}

      {/* Preview section */}
      {(job.status === "PREVIEW_READY" || job.status === "READY") && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="font-semibold text-emerald-800">Preview Available</h2>
          <div className="mt-2">
            <a
              href={`/p/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Open Preview
              <span className="text-xs">&rarr;</span>
            </a>
          </div>
          {job.renderedPages && job.renderedPages.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-emerald-700">Preview Pages:</p>
              {job.renderedPages
                .filter((rp) => rp.renderStatus === "DONE")
                .map((rp) => (
                  <div key={rp.id} className="flex items-center gap-2 text-sm">
                    <code className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800">
                      {rp.previewPath || "/"}
                    </code>
                    <a
                      href={`/p/${job.id}${rp.previewPath === "/" ? "" : rp.previewPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline text-xs"
                    >
                      Open
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Crawl summary */}
      {job.crawlRun && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">Crawl Run</h2>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status:</span> {job.crawlRun.status}
            </div>
            <div>
              <span className="text-gray-500">Pages:</span> {job.crawlRun.pageCount}
            </div>
            {job.crawlRun.finishedAt && (
              <div>
                <span className="text-gray-500">Finished:</span>{" "}
                {new Date(job.crawlRun.finishedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected pages */}
      {job.selectedPages.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">Selected Pages</h2>
          <div className="mt-2 space-y-2">
            {job.selectedPages.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {p.pageType}
                </span>
                <span className="text-gray-700">{p.title ?? p.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendered pages */}
      {job.renderedPages && job.renderedPages.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">Rendered Pages</h2>
          <div className="mt-3 space-y-3">
            {job.renderedPages.map((rp) => (
              <div key={rp.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        rp.renderStatus === "DONE"
                          ? "bg-green-100 text-green-700"
                          : rp.renderStatus === "RENDERING"
                          ? "bg-purple-100 text-purple-700"
                          : rp.renderStatus === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {rp.renderStatus}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-md" title={rp.sourceUrl}>
                      {rp.sourceUrl}
                    </span>
                  </div>
                  {rp.renderDurationMs != null && (
                    <span className="text-xs text-gray-400">{rp.renderDurationMs}ms</span>
                  )}
                </div>
                {rp.extractedJson && (
                  <div className="mt-1 text-sm text-gray-500">
                    {rp.extractedJson.title && (
                      <span className="font-medium text-gray-700">{rp.extractedJson.title}</span>
                    )}
                    {rp.extractedJson.metaDescription && (
                      <span className="ml-2 text-gray-400">— {rp.extractedJson.metaDescription}</span>
                    )}
                  </div>
                )}
                {rp.screenshotBlobKey && (
                  <div className="mt-2 flex h-8 w-32 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                    Screenshot captured
                  </div>
                )}
                {rp.renderStatus === "FAILED" && rp.errorMessage && (
                  <p className="mt-1 text-xs text-red-500">{rp.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered pages table */}
      {job.discoveredPages.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold">Discovered Pages</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="pb-2 pr-4">URL</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2">Selected</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {job.discoveredPages.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4">
                      <div className="max-w-xs truncate" title={p.url}>
                        {p.normalizedUrl}
                      </div>
                      {p.title && (
                        <div className="text-xs text-gray-400">{p.title}</div>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                        {p.pageType ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{p.score?.toFixed(2) ?? "—"}</td>
                    <td className="py-2">
                      {p.selected ? (
                        <span className="text-green-600">&#10003;</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
