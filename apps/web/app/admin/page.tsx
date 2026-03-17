import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time-utils";
import Link from "next/link";

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

const EVENT_BADGE: Record<string, string> = {
  widget_loaded: "bg-gray-700 text-gray-300",
  widget_opened: "bg-blue-900/60 text-blue-300",
  message_sent: "bg-purple-900/60 text-purple-300",
  cta_shown: "bg-yellow-900/60 text-yellow-300",
  cta_clicked: "bg-orange-900/60 text-orange-300",
  lead_submitted: "bg-emerald-900/60 text-emerald-300",
};

const FUNNEL_STEPS = [
  { key: "PENDING", label: "Submitted" },
  { key: "QUEUED", label: "Queued" },
  { key: "CRAWLING", label: "Crawling" },
  { key: "READY_FOR_RENDER", label: "Ready for Render" },
  { key: "RENDERING", label: "Rendering" },
  { key: "PREVIEW_READY", label: "Preview Ready" },
] as const;

export default async function AdminDashboard({
  searchParams,
}: {
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

  const [
    totalSubmissions,
    demosActive,
    ctaClicks,
    leadsCaptured,
    funnelRaw,
    eventBreakdown,
    recentJobs,
    recentEvents,
    totalEvents,
  ] = await Promise.all([
    prisma.previewJob.count(),
    prisma.previewJob.count({
      where: { status: { in: ["PREVIEW_READY", "RENDER_COMPLETE", "READY"] } },
    }),
    prisma.previewEvent.count({ where: { eventName: "cta_clicked" } }),
    prisma.previewJob.count({ where: { email: { not: null } } }),
    prisma.previewJob.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.previewEvent.groupBy({
      by: ["eventName"],
      _count: { _all: true },
      orderBy: { _count: { eventName: "desc" } },
    }),
    prisma.previewJob.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { events: true } },
        events: { where: { eventName: "cta_clicked" }, take: 1, select: { id: true } },
      },
    }),
    prisma.previewEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { previewJob: { select: { normalizedDomain: true } } },
    }),
    prisma.previewEvent.count(),
  ]);

  const funnel: Record<string, number> = {};
  for (const row of funnelRaw) funnel[row.status] = row._count._all;

  const funnelMax = Math.max(1, ...FUNNEL_STEPS.map((s) => funnel[s.key] ?? 0));

  const eventTotal = eventBreakdown.reduce((s, r) => s + r._count._all, 0) || 1;

  const statCards = [
    { label: "Total Submissions", value: totalSubmissions, icon: "📋" },
    { label: "Demos Active", value: demosActive, icon: "🟢" },
    { label: "CTA Clicks", value: ctaClicks, icon: "🖱️" },
    { label: "Leads Captured", value: leadsCaptured, icon: "📧" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 px-6 py-5"
          >
            <div className="text-3xl font-bold tabular-nums">{card.value}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <span>{card.icon}</span>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-200">Conversion Funnel</h2>
        <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-6">
          <div className="flex items-end gap-3">
            {FUNNEL_STEPS.map((step, i) => {
              const count = funnel[step.key] ?? 0;
              const pct = Math.max(8, (count / funnelMax) * 100);
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xl font-bold tabular-nums">{count}</span>
                  <div className="w-full overflow-hidden rounded-lg bg-white/[0.05]" style={{ height: 120 }}>
                    <div
                      className="w-full rounded-lg bg-orange-500/70 transition-all"
                      style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                    />
                  </div>
                  <span className="text-center text-xs text-gray-500">{step.label}</span>
                  {i < FUNNEL_STEPS.length - 1 && (
                    <span className="absolute text-gray-600">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Submissions */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-200">Recent Submissions</h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80">
          {recentJobs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">No submissions yet</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3">Domain</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3 text-right">Events</th>
                  <th className="px-5 py-3 text-center">CTA</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">{job.normalizedDomain}</td>
                    <td className="px-5 py-3 text-gray-400">{job.email ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status] ?? "bg-gray-700 text-gray-300"}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{timeAgo(job.createdAt)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-400">
                      {job._count.events || "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {job.events.length > 0 ? (
                        <span className="text-emerald-400">✅</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/jobs/${job.id}?secret=${secret}`}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          View Details
                        </Link>
                        {(job.status === "PREVIEW_READY" || job.status === "READY") && (
                          <a
                            href={`/p/${job.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            Preview ↗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Widget Engagement */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">Widget Engagement</h2>
          <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80">
            <div className="border-b border-white/[0.06] px-5 py-3">
              <span className="text-sm text-gray-400">
                Total events: <span className="font-medium text-white">{totalEvents}</span>
              </span>
            </div>
            {eventBreakdown.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500">No events yet</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-2.5">Event Type</th>
                    <th className="px-5 py-2.5 text-right">Count</th>
                    <th className="px-5 py-2.5 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {eventBreakdown.map((row) => (
                    <tr key={row.eventName} className="hover:bg-white/[0.03]">
                      <td className="px-5 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_BADGE[row.eventName] ?? "bg-gray-700 text-gray-300"}`}
                        >
                          {row.eventName}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{row._count._all}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-gray-400">
                        {((row._count._all / eventTotal) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Live Recent Events */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">Recent Events</h2>
          <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80">
            {recentEvents.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500">No events yet</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentEvents.map((event) => (
                  <div key={event.id} className="px-5 py-3 hover:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_BADGE[event.eventName] ?? "bg-gray-700 text-gray-300"}`}
                      >
                        {event.eventName}
                      </span>
                      <span className="text-xs text-gray-500">{timeAgo(event.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-gray-300">{event.previewJob.normalizedDomain}</span>
                      {event.eventPayload && (
                        <span className="max-w-[200px] truncate text-xs text-gray-600">
                          {JSON.stringify(event.eventPayload).slice(0, 80)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
