"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface JobSummary {
  id: string;
  submittedUrl: string;
  normalizedDomain: string;
  status: string;
  email: string | null;
  createdAt: string;
  crawlRun: { status: string; pageCount: number } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-gray-600",
  QUEUED: "text-gray-600",
  CRAWLING: "text-blue-600",
  CLASSIFYING: "text-yellow-600",
  READY_FOR_RENDER: "text-green-600",
  READY: "text-green-600",
  FAILED: "text-red-600",
  EXPIRED: "text-gray-400",
};

export default function AdminPreviewJobsPage() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!secret) {
      setError("Missing secret parameter");
      setLoading(false);
      return;
    }

    fetch(`/api/admin/preview-jobs?secret=${encodeURIComponent(secret)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error?.message ?? "Unauthorized");
        } else {
          setJobs(data.data);
        }
      })
      .catch(() => setError("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, [secret]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-red-700">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Admin: Preview Jobs</h1>
        <p className="mt-1 text-sm text-gray-500">Last 20 jobs</p>

        <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="text-xs">{job.id.slice(0, 12)}...</code>
                  </td>
                  <td className="px-4 py-3">{job.normalizedDomain}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${STATUS_COLORS[job.status] ?? ""}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {job.crawlRun?.pageCount ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/preview-jobs/${job.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
