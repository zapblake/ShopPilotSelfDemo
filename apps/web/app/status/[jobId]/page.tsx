interface StatusPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function StatusPage({ params }: StatusPageProps) {
  const { jobId } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold">Job Status</h1>
        <p className="mt-2 text-gray-600">
          Tracking job: <code className="rounded bg-gray-100 px-2 py-1 text-sm">{jobId}</code>
        </p>
        <p className="mt-4 text-gray-500">
          Real-time status updates coming in Phase 1.
        </p>
      </div>
    </main>
  );
}
