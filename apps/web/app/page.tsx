import { Suspense } from "react";
import { PreviewRequestForm } from "@/components/PreviewRequestForm";
import Image from "next/image";

export default function HomePage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "500px",
        background: "radial-gradient(ellipse at center, rgba(245,104,10,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-10%",
        width: "400px", height: "400px",
        background: "radial-gradient(ellipse at center, rgba(201,69,13,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

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
      }}>
        <Suspense fallback={null}>
          <PreviewRequestForm />
        </Suspense>
      </div>

      {/* Social proof */}
      <div style={{
        marginTop: "32px", display: "flex", alignItems: "center", gap: "8px",
        fontSize: "13px", color: "rgba(255,255,255,0.3)",
      }}>
        <span>🔒</span>
        <span>No install · No credit card · Ready in ~30 seconds</span>
      </div>
    </main>
  );
}
