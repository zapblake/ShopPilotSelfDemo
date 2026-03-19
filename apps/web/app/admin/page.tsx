import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time-utils";
import Link from "next/link";

// Heat score: how engaged is this lead?
function heatScore(events: { eventName: string }[]) {
  let score = 0;
  for (const e of events) {
    if (e.eventName === "widget_loaded") score += 1;
    if (e.eventName === "widget_opened") score += 3;
    if (e.eventName === "message_sent") score += 5;
    if (e.eventName === "cta_shown") score += 2;
    if (e.eventName === "cta_clicked") score += 20;
  }
  return score;
}

function heatLabel(score: number): { label: string; color: string; dot: string } {
  if (score >= 20) return { label: "🔥 Hot", color: "text-orange-400", dot: "bg-orange-500" };
  if (score >= 10) return { label: "⚡ Warm", color: "text-yellow-400", dot: "bg-yellow-500" };
  if (score >= 3) return { label: "👀 Engaged", color: "text-blue-400", dot: "bg-blue-500" };
  return { label: "New", color: "text-gray-500", dot: "bg-gray-600" };
}

export default async function AdminCRM({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string; filter?: string }>;
}) {
  const { secret, filter } = await searchParams;

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <div className="rounded-lg border border-red-800/50 bg-red-950/50 px-8 py-6 text-red-400">
          401 — Unauthorized
        </div>
      </main>
    );
  }

  const jobs = await prisma.previewJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      events: { select: { eventName: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });

  // Enrich each job with heat score + signals
  const leads = jobs.map((job) => {
    const score = heatScore(job.events);
    const heat = heatLabel(score);
    const messagesCount = job.events.filter((e) => e.eventName === "message_sent").length;
    const widgetOpened = job.events.some((e) => e.eventName === "widget_opened");
    const ctaClicked = job.events.some((e) => e.eventName === "cta_clicked");
    const lastActivity = job.events[0]?.createdAt ?? job.createdAt;
    return { ...job, score, heat, messagesCount, widgetOpened, ctaClicked, lastActivity };
  });

  // Filter
  const filtered =
    filter === "hot"
      ? leads.filter((l) => l.score >= 20)
      : filter === "warm"
        ? leads.filter((l) => l.score >= 10 && l.score < 20)
        : filter === "engaged"
          ? leads.filter((l) => l.score >= 3 && l.score < 10)
          : filter === "email"
            ? leads.filter((l) => !!l.email)
            : leads;

  // Top stats
  const totalLeads = leads.length;
  const withEmail = leads.filter((l) => !!l.email).length;
  const engaged = leads.filter((l) => l.score >= 3).length;
  const hot = leads.filter((l) => l.score >= 20).length;

  const filterLink = (f: string, label: string, active: boolean) =>
    `<a href="/admin?secret=${secret}${f ? `&filter=${f}` : ""}" style="padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;text-decoration:none;${active ? "background:#ff6b35;color:white;" : "background:rgba(255,255,255,0.05);color:#9ca3af;"}">${label}</a>`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">Everyone who submitted their store for a demo</p>
        </div>
        <div className="text-sm text-gray-500">
          {filtered.length} of {totalLeads} leads
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Leads", value: totalLeads, icon: "👥", sub: "all submissions" },
          { label: "Have Email", value: withEmail, icon: "📧", sub: "contactable" },
          { label: "Engaged", value: engaged, icon: "⚡", sub: "opened widget" },
          { label: "Hot Leads", value: hot, icon: "🔥", sub: "clicked CTA" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 px-5 py-4"
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl font-bold tabular-nums">{card.value}</div>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="mt-2 text-sm font-medium text-gray-300">{card.label}</div>
            <div className="text-xs text-gray-600">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {[
          { f: "", label: "All" },
          { f: "hot", label: "🔥 Hot" },
          { f: "warm", label: "⚡ Warm" },
          { f: "engaged", label: "👀 Engaged" },
          { f: "email", label: "📧 Has Email" },
        ].map(({ f, label }) => (
          <Link
            key={f}
            href={`/admin?secret=${secret}${f ? `&filter=${f}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f || (!filter && !f)
                ? "bg-orange-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">No leads yet</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">Heat</th>
                <th className="px-5 py-3 text-center">Widget</th>
                <th className="px-5 py-3 text-center">Messages</th>
                <th className="px-5 py-3 text-center">CTA</th>
                <th className="px-5 py-3">Last Activity</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((lead) => (
                <tr key={lead.id} className="group transition-colors hover:bg-white/[0.03]">
                  {/* Lead identity */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-white">{lead.normalizedDomain}</div>
                    {lead.email ? (
                      <div className="mt-0.5 text-xs text-gray-400">{lead.email}</div>
                    ) : (
                      <div className="mt-0.5 text-xs text-gray-700">no email</div>
                    )}
                  </td>

                  {/* Heat */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${lead.heat.dot}`} />
                      <span className={`text-sm font-medium ${lead.heat.color}`}>
                        {lead.heat.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-700">{lead.score} pts</div>
                  </td>

                  {/* Widget opened */}
                  <td className="px-5 py-4 text-center text-lg">
                    {lead.widgetOpened ? "✅" : <span className="text-gray-700">—</span>}
                  </td>

                  {/* Messages */}
                  <td className="px-5 py-4 text-center">
                    {lead.messagesCount > 0 ? (
                      <span className="font-semibold text-purple-400">{lead.messagesCount}</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>

                  {/* CTA clicked */}
                  <td className="px-5 py-4 text-center text-lg">
                    {lead.ctaClicked ? (
                      <span title="Clicked Book a Demo">🔥</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>

                  {/* Last activity */}
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {timeAgo(lead.lastActivity)}
                  </td>

                  {/* Submitted */}
                  <td className="px-5 py-4 text-xs text-gray-600">
                    {timeAgo(lead.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/admin/jobs/${lead.id}?secret=${secret}`}
                        className="text-xs text-orange-400 hover:text-orange-300"
                      >
                        Details
                      </Link>
                      <a
                        href={`/demo/${lead.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Preview ↗
                      </a>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=Your ZapSight Demo is Ready&body=Hi there! I noticed you checked out the Shop Pilot demo for ${lead.normalizedDomain}. I'd love to show you what it looks like with your real inventory — book a quick call: https://calendly.com/blake-zapsight/30min`}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Email ↗
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
    </main>
  );
}
