import { JobStatusView } from "./JobStatusView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PreviewJobPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <JobStatusView jobId={id} />
      </div>
    </main>
  );
}
