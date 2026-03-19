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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* URL input — accepts anything, https:// added automatically */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
          🛍️
        </span>
        <input
          type="text"
          required
          placeholder="yourstore.com or yourstore.myshopify.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Email — required so we can send them their link */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
          ✉️
        </span>
        <input
          type="email"
          required
          placeholder="your@email.com — we'll send you the preview link"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !url || !email}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Building your preview..." : "See My Store with AI →"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Takes ~30 seconds. No install required.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
