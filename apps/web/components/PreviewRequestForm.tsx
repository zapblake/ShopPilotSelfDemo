"use client";

import { useState } from "react";

export function PreviewRequestForm() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
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
        body: JSON.stringify({
          url,
          email: email || undefined,
          storeName: storeName || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message ?? "Something went wrong");
        return;
      }

      window.location.href = `/preview-jobs/${data.data.jobId}`;
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          required
          placeholder="https://your-store.myshopify.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email (optional) — we'll notify you when it's ready"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Store name (optional)"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Analyzing your store..." : "Generate Preview"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
