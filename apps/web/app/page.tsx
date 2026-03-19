import { Suspense } from "react";
import { PreviewRequestForm } from "@/components/PreviewRequestForm";
import Image from "next/image";

export default function HomePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow blobs — matches ZapSight brand site aesthetic */}

      {/* Top-center green glow */}
      <div style={{
        position: "absolute", top: "-5%", left: "50%", transform: "translateX(-50%)",
        width: "900px", height: "400px",
        background: "radial-gradient(ellipse at center, rgba(30,100,50,0.28) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Bottom-wide orange/burnt sienna glow — the signature warmth */}
      <div style={{
        position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)",
        width: "1200px", height: "500px",
        background: "radial-gradient(ellipse at center, rgba(196,74,21,0.40) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Bottom-left hot pink accent dot */}
      <div style={{
        position: "absolute", bottom: "20%", left: "2%",
        width: "12px", height: "12px",
        borderRadius: "50%",
        background: "#e83060",
        boxShadow: "0 0 20px 6px rgba(232,48,96,0.5)",
        pointerEvents: "none",
      }} />

      {/* Scattered particles */}
      {[
        { top: "12%", left: "8%",  color: "#ff6a30", size: 3 },
        { top: "18%", left: "72%", color: "#4a7bff", size: 2 },
        { top: "32%", left: "88%", color: "#6b8fcc", size: 2 },
        { top: "55%", left: "15%", color: "#e8852a", size: 3 },
        { top: "65%", left: "80%", color: "#ff6a30", size: 2 },
        { top: "8%",  left: "45%", color: "#4a7bff", size: 2 },
        { top: "42%", left: "5%",  color: "#ff6a30", size: 2 },
        { top: "75%", left: "60%", color: "#e8852a", size: 3 },
      ].map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          top: p.top, left: p.left,
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: "50%",
          background: p.color,
          boxShadow: `0 0 ${p.size * 3}px ${p.size}px ${p.color}88`,
          opacity: 0.7,
          pointerEvents: "none",
        }} />
      ))}

      {/* Logo / wordmark */}
      <div style={{ marginBottom: "48px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "12px",
        }}>
          <Image src="/favicon.png" alt="ZapSight" width={36} height={36} style={{ borderRadius: "8px" }} />
          <span style={{
            fontSize: "22px", fontWeight: 700, color: "white", letterSpacing: "-0.4px",
          }}>ZapSight</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", maxWidth: "560px", marginBottom: "40px" }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(245,104,10,0.10)", border: "1px solid rgba(245,104,10,0.25)",
          borderRadius: "100px", padding: "6px 16px", marginBottom: "24px",
          fontSize: "13px", color: "#f5680a", fontWeight: 600,
        }}>
          Shop Pilot — Free Preview
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-1.5px",
          color: "white",
          margin: "0 0 16px",
        }}>
          See your store with{" "}
          <span style={{
            background: "linear-gradient(135deg, #f5680a 0%, #ff8d29 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            AI inside it
          </span>
        </h1>

        <p style={{
          fontSize: "17px",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.6,
          margin: 0,
        }}>
          Enter your store URL and we&apos;ll build a live preview with Shop Pilot — ZapSight&apos;s AI sales assistant — running on your actual pages.
        </p>
      </div>

      {/* Form card */}
      <div style={{
        width: "100%", maxWidth: "480px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "32px",
        backdropFilter: "blur(12px)",
        position: "relative",
        zIndex: 1,
      }}>
        <Suspense fallback={null}>
          <PreviewRequestForm />
        </Suspense>
      </div>

      {/* Social proof */}
      <div style={{
        marginTop: "32px", display: "flex", alignItems: "center", gap: "8px",
        fontSize: "13px", color: "rgba(255,255,255,0.3)",
        position: "relative", zIndex: 1,
      }}>
        <span>🔒</span>
        <span>No install · No credit card · Ready in ~30 seconds</span>
      </div>
    </main>
  );
}
