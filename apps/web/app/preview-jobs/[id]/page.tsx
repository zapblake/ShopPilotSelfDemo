import { JobStatusView } from "./JobStatusView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PreviewJobPage({ params }: Props) {
  const { id } = await params;
  return (
    <main style={{
      background: "#0a0a0f",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Brand background — matches zapsight.us */}
      <div style={{
        position: "absolute", top: "-5%", left: "50%", transform: "translateX(-50%)",
        width: "900px", height: "400px",
        background: "radial-gradient(ellipse at center, rgba(30,100,50,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "1200px", height: "500px",
        background: "radial-gradient(ellipse at center, rgba(196,74,21,0.38) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "22%", left: "2%",
        width: "10px", height: "10px", borderRadius: "50%",
        background: "#e83060", boxShadow: "0 0 18px 5px rgba(232,48,96,0.5)",
        pointerEvents: "none",
      }} />
      {/* Particles */}
      {([
        { top: "10%", left: "6%",  color: "#ff6a30", size: 3 },
        { top: "20%", left: "75%", color: "#4a7bff", size: 2 },
        { top: "60%", left: "90%", color: "#ff6a30", size: 2 },
        { top: "45%", left: "8%",  color: "#e8852a", size: 2 },
        { top: "80%", left: "55%", color: "#4a7bff", size: 2 },
      ] as { top: string; left: string; color: string; size: number }[]).map((p, i) => (
        <div key={i} style={{
          position: "absolute", top: p.top, left: p.left,
          width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%",
          background: p.color, boxShadow: `0 0 ${p.size * 3}px ${p.size}px ${p.color}88`,
          opacity: 0.65, pointerEvents: "none",
        }} />
      ))}

      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
        <JobStatusView jobId={id} />
      </div>
    </main>
  );
}
