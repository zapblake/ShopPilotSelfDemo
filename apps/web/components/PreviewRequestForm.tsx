"use client";

import { useState } from "react";

export function PreviewRequestForm() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/preview-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email: email || undefined }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message ?? "Something went wrong");
        return;
      }

      setResult({ id: data.data.id });
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
          type="url"
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
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Generate Preview"}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {result && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          Preview job created!{" "}
          <a
            href={`/status/${result.id}`}
            className="font-medium underline"
          >
            Track status
          </a>
        </div>
      )}
    </form>
  );
}
