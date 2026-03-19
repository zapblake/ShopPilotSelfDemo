import { JobStatusView } from "./JobStatusView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PreviewJobPage({ params }: Props) {
  const { id } = await params;
  return (
    <main style={{background:"#0a0a0a", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"}}>
      <JobStatusView jobId={id} />
    </main>
  );
}
