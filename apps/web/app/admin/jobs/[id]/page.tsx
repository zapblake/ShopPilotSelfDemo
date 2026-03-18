import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time-utils";
import Link from "next/link";
import { notFound } from "next/navigation";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-gray-700 text-gray-300",
  QUEUED: "bg-gray-700 text-gray-300",
  CRAWLING: "bg-blue-900/60 text-blue-300",
  CLASSIFYING: "bg-yellow-900/60 text-yellow-300",
  READY_FOR_RENDER: "bg-cyan-900/60 text-cyan-300",
  RENDERING: "bg-purple-900/60 text-purple-300",
  RENDER_COMPLETE: "bg-green-900/60 text-green-300",
  PREVIEW_READY: "bg-emerald-900/60 text-emerald-300",
  READY: "bg-emerald-900/60 text-emerald-300",
  FAILED: "bg-red-900/60 text-red-300",
  EXPIRED: "bg-gray-800 text-gray-500",
};

const RENDER_BADGE: Record<string, string> = {
  PENDING: "bg-gray-700 text-gray-300",
  RENDERING: "bg-purple-900/60 text-purple-300",
  DONE: "bg-emerald-900/60 text-emerald-300",
  FAILED: "bg-red-900/60 text-red-300",
};

const EVENT_BADGE: Record<string, string> = {
  widget_loaded: "bg-gray-700 text-gray-300",
  widget_opened: "bg-blue-900/60 text-blue-300",
  message_sent: "bg-purple-900/60 text-purple-300",
  cta_shown: "bg-yellow-900/60 text-yellow-300",
  cta_clicked: "bg-orange-900/60 text-orange-300",
  lead_submitted: "bg-emerald-900/60 text-emerald-300",
};

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <div className="rounded-lg border border-red-800/50 bg-red-950/50 px-8 py-6 text-red-400">
          401 — Unauthorized
        </div>
      </main>
    );
  }

  const { id } = await params;

  const job = await prisma.previewJob.findUnique({
    where: { id },
    include: {
      crawlRuns: {
        include: { discoveredPages: { orderBy: { score: "desc" } } },
      },
      renderedPages: { orderBy: { renderStartedAt: "asc" } },
      previewHosts: true,
      widgetConfig: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!job) notFound();

  const isPreviewReady = job.status === "PREVIEW_READY" || job.status === "READY";

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Back Link */}
      <Link
        href={`/admin?secret=${secret}`}
        className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-300"
      >
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.normalizedDomain}</h1>
          <p className="mt-1 text-sm text-gray-500">{job.submittedUrl}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[job.status] ?? "bg-gray-700 text-gray-300"}`}
        >
          {job.status}
        </span>
      </div>

      {/* Metadata */}
      <section className="mt-6 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Job Metadata
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Job ID" value={job.id} mono />
          <Field label="Email" value={job.email ?? "—"} />
          <Field label="Status" value={job.status} />
          <Field label="Created" value={`${timeAgo(job.createdAt)} (${job.createdAt.toISOString()})`} />
          <Field label="Updated" value={job.updatedAt.toISOString()} />
          <Field label="Completed" value={job.completedAt?.toISOString() ?? "—"} />
          {job.errorCode && <Field label="Error Code" value={job.errorCode} />}
          {job.errorMessage && <Field label="Error Message" value={job.errorMessage} />}
          {isPreviewReady && (
            <div>
              <span className="text-xs text-gray-500">Preview URL</span>
              <div>
                <a
                  href={`/p/${job.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  /p/{job.id} ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lead Info */}
      {job.email && (
        <section className="mt-6 rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Lead Captured
          </h2>
          <p className="text-lg font-medium">{job.email}</p>
          <p className="mt-1 text-sm text-gray-400">
            Submitted: {job.submittedUrl}
          </p>
        </section>
      )}

      {/* Widget Config */}
      {job.widgetConfig && (
        <section className="mt-6 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Widget Config
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store Name" value={job.widgetConfig.storeName ?? "—"} />
            <Field label="Primary Color" value={job.widgetConfig.primaryColor ?? "—"} />
            <Field label="Mode" value={job.widgetConfig.mode} />
            {job.widgetConfig.promptContext && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-500">Prompt Context</span>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
                  {job.widgetConfig.promptContext}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Preview Hosts */}
      {job.previewHosts.length > 0 && (
        <section className="mt-6 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Preview Hosts
          </h2>
          <div className="space-y-2">
            {job.previewHosts.map((host: { id: string; active: boolean; hostname: string; previewBaseUrl?: string | null }) => (
              <div key={host.id} className="flex items-center gap-3 text-sm">
                <span className={`h-2 w-2 rounded-full ${host.active ? "bg-emerald-400" : "bg-gray-600"}`} />
                <code className="text-gray-300">{host.hostname}</code>
                {host.previewBaseUrl && (
                  <a
                    href={host.previewBaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    {host.previewBaseUrl} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Crawl Runs & Discovered Pages */}
      {job.crawlRuns.map((run) => (
        <section key={run.id} className="mt-6 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Crawl Run — {run.status}
          </h2>
          <div className="mb-4 grid gap-4 text-sm sm:grid-cols-3">
            <Field label="Provider" value={run.provider} />
            <Field label="Started" value={run.startedAt?.toISOString() ?? "—"} />
            <Field label="Finished" value={run.finishedAt?.toISOString() ?? "—"} />
          </div>
          {run.discoveredPages.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-2">URL</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-right">Score</th>
                    <th className="px-4 py-2 text-center">Selected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {run.discoveredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-white/[0.03]">
                      <td className="max-w-[300px] truncate px-4 py-2 text-gray-300">
                        {page.url}
                      </td>
                      <td className="px-4 py-2 text-gray-400">
                        {page.pageType ?? page.pageTypeCandidate ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-400">
                        {page.score?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {page.selected ? (
                          <span className="text-emerald-400">✓</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {/* Rendered Pages */}
      {job.renderedPages.length > 0 && (
        <section className="mt-6 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Rendered Pages ({job.renderedPages.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2">Preview Path</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Duration</th>
                  <th className="px-4 py-2">Storage Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {job.renderedPages.map((rp) => (
                  <tr key={rp.id} className="hover:bg-white/[0.03]">
                    <td className="max-w-[250px] truncate px-4 py-2 text-gray-300">
                      {rp.previewPath}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${RENDER_BADGE[rp.renderStatus] ?? "bg-gray-700 text-gray-300"}`}
                      >
                        {rp.renderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-400">
                      {rp.renderDurationMs ? `${rp.renderDurationMs}ms` : "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2">
                      <code className="text-xs text-gray-500">{rp.htmlBlobKey ?? "—"}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Events Timeline */}
      <section className="mt-6 rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Events ({job.events.length})
        </h2>
        {job.events.length === 0 ? (
          <p className="text-sm text-gray-500">No events recorded</p>
        ) : (
          <div className="space-y-3">
            {job.events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3"
              >
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_BADGE[event.eventName] ?? "bg-gray-700 text-gray-300"}`}
                >
                  {event.eventName}
                </span>
                <span className="text-xs text-gray-500">{timeAgo(event.createdAt)}</span>
                {event.sessionId && (
                  <code className="text-xs text-gray-600">session: {event.sessionId.slice(0, 8)}</code>
                )}
                {event.eventPayload && (
                  <pre className="mt-1 w-full overflow-x-auto rounded bg-black/30 px-3 py-2 text-xs text-gray-400">
                    {JSON.stringify(event.eventPayload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className={`mt-0.5 text-sm ${mono ? "font-mono text-gray-400" : "text-gray-200"}`}>
        {value}
      </p>
    </div>
  );
}
