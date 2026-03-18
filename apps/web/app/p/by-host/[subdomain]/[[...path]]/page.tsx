import { prisma } from "@/lib/prisma";
import { getStorageAdapter } from "@zapsight/storage";
import { getRenderedPageForPath, rewriteHtml } from "@zapsight/preview";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";

interface ByHostPageProps {
  params: Promise<{ subdomain: string; path?: string[] }>;
}

function toDisplayName(subdomain: string): string {
  return subdomain
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAnd\b/g, "&")
    .replace(/\bUs\b/g, "US")
    .replace(/\bUsa\b/g, "USA");
}

function NotFoundPage({ subdomain }: { subdomain: string }) {
  const displayName = toDisplayName(subdomain);
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ZapSight Preview — {displayName}</title>
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box}
          body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
          .logo{display:flex;align-items:center;gap:10px;margin-bottom:48px}
          .logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
          .logo-text{font-size:20px;font-weight:700;color:#fff}
          .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 40px;max-width:520px;width:100%;text-align:center}
          .store-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,107,53,0.12);border:1px solid rgba(255,107,53,0.25);border-radius:30px;padding:6px 16px;font-size:13px;color:#ff6b35;font-weight:600;margin-bottom:24px}
          h1{font-size:28px;font-weight:800;line-height:1.2;margin-bottom:12px;color:#fff}
          .sub{font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:32px}
          .highlight{color:#fff;font-weight:600}
          .form-row{display:flex;gap:10px;margin-bottom:16px}
          .input{flex:1;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px 16px;font-size:14px;color:#fff;outline:none}
          .input::placeholder{color:rgba(255,255,255,0.3)}
          .btn{background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;border:none;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap}
          .divider{display:flex;align-items:center;gap:12px;margin:24px 0;color:rgba(255,255,255,0.2);font-size:12px}
          .divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.08)}
          .demo-link{display:block;text-align:center;color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none}
          .demo-link span{color:#ff6b35;font-weight:600}
          .features{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:32px;padding-top:32px;border-top:1px solid rgba(255,255,255,0.06)}
          .feature{text-align:center}
          .feature-icon{font-size:22px;margin-bottom:6px}
          .feature-text{font-size:11px;color:rgba(255,255,255,0.4);line-height:1.4}
        `}</style>
      </head>
      <body>
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">ZapSight</span>
        </div>
        <div className="card">
          <div className="store-badge">✨ {displayName}</div>
          <h1>See Shop Pilot on<br /><span style={{color:"#ff6b35"}}>{displayName}</span></h1>
          <p className="sub">
            Enter your email and we'll build a live preview of our AI shopping assistant on your store —
            <span className="highlight"> no install, no commitment.</span>
          </p>
          <form action="https://zapsight.us/api/preview-jobs" method="POST" id="pf">
            <input type="hidden" name="url" value={`https://${subdomain.replace(/-/g, '')}.com`} />
            <div className="form-row">
              <input className="input" type="email" name="email" placeholder="your@email.com" required />
              <button className="btn" type="submit">Build Preview →</button>
            </div>
          </form>
          <div className="divider">or</div>
          <a href="https://calendly.com/blake-zapsight/30min" className="demo-link" target="_blank">
            Prefer a live demo? <span>Book 15 minutes →</span>
          </a>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">Ready in 60 seconds</div>
            </div>
            <div className="feature">
              <div className="feature-icon">🛍️</div>
              <div className="feature-text">Your store, your catalog</div>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">No install required</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

function BuildingPage({ subdomain, jobId }: { subdomain: string; jobId: string }) {
  const displayName = toDisplayName(subdomain);
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Building your preview — {displayName}</title>
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box}
          body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
          .logo{display:flex;align-items:center;gap:10px;margin-bottom:48px}
          .logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
          .logo-text{font-size:20px;font-weight:700;color:#fff}
          .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 40px;max-width:480px;width:100%;text-align:center}
          .store-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,107,53,0.12);border:1px solid rgba(255,107,53,0.25);border-radius:30px;padding:6px 16px;font-size:13px;color:#ff6b35;font-weight:600;margin-bottom:24px}
          h1{font-size:26px;font-weight:800;margin-bottom:12px}
          .sub{font-size:15px;color:rgba(255,255,255,0.5);margin-bottom:36px;line-height:1.6}
          .progress-wrap{background:rgba(255,255,255,0.06);border-radius:100px;height:6px;margin-bottom:12px;overflow:hidden}
          .progress-bar{height:100%;border-radius:100px;background:linear-gradient(90deg,#ff6b35,#f7931e);animation:prog 3s ease-in-out infinite}
          @keyframes prog{0%{width:15%}50%{width:75%}100%{width:95%}}
          .status{font-size:13px;color:rgba(255,255,255,0.35);margin-bottom:32px}
          .steps{text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:32px}
          .step{display:flex;align-items:center;gap:12px;font-size:14px;color:rgba(255,255,255,0.5)}
          .step.done{color:rgba(255,255,255,0.85)}
          .step-icon{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
          .step.done .step-icon{background:rgba(74,222,128,0.15);color:#4ade80}
          .step.active .step-icon{background:rgba(255,107,53,0.15);color:#ff6b35;animation:pulse 1.5s ease-in-out infinite}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
          .notify-link{display:block;color:rgba(255,255,255,0.35);font-size:13px;text-decoration:none;margin-top:4px}
          .notify-link span{color:#ff6b35}
        `}</style>
        <script dangerouslySetInnerHTML={{__html: `
          setTimeout(function(){ window.location.reload(); }, 8000);
        `}} />
      </head>
      <body>
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">ZapSight</span>
        </div>
        <div className="card">
          <div className="store-badge">✨ {displayName}</div>
          <h1>Building your preview…</h1>
          <p className="sub">We're setting up Shop Pilot on <strong style={{color:"#fff"}}>{displayName}</strong>. This takes about 60 seconds.</p>
          <div className="progress-wrap">
            <div className="progress-bar"></div>
          </div>
          <p className="status">Analyzing your store catalog…</p>
          <div className="steps">
            <div className="step done"><div className="step-icon">✓</div>Store URL received</div>
            <div className="step done"><div className="step-icon">✓</div>Catalog pages discovered</div>
            <div className="step active"><div className="step-icon">⚡</div>Building AI context</div>
            <div className="step"><div className="step-icon">○</div>Injecting Shop Pilot widget</div>
            <div className="step"><div className="step-icon">○</div>Preview ready</div>
          </div>
          <a href={`/preview-jobs/${jobId}`} className="notify-link">
            View detailed status <span>→</span>
          </a>
        </div>
      </body>
    </html>
  );
}

export default async function ByHostPreviewPage({ params }: ByHostPageProps) {
  const { subdomain, path } = await params;
  const previewPath = path ? "/" + path.join("/") : "/";
  const hostname = `${subdomain}.zapsight.us`;

  // Look up PreviewHost
  const previewHost = await prisma.previewHost.findUnique({
    where: { hostname },
    include: { previewJob: true },
  });

  // No preview exists — show personalized "build your preview" page
  if (!previewHost || !previewHost.active) {
    return <NotFoundPage subdomain={subdomain} />;
  }

  const jobId = previewHost.previewJobId;
  const job = previewHost.previewJob;

  // Preview is building — show progress page
  if (job?.status && !["PREVIEW_READY", "RENDER_COMPLETE", "READY"].includes(job.status)) {
    return <BuildingPage subdomain={subdomain} jobId={jobId} />;
  }

  // Preview is ready — serve it
  const storage = getStorageAdapter();
  const result = await getRenderedPageForPath(prisma, storage, jobId, previewPath);

  if (!result) {
    return <BuildingPage subdomain={subdomain} jobId={jobId} />;
  }

  const domain = job?.normalizedDomain ?? subdomain;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zapsight.us";

  let html = rewriteHtml(result.html, {
    previewJobId: jobId,
    originalDomain: domain,
    previewBasePath: "",
    mode: "subdomain",
  });

  const widgetConfig = await buildWidgetConfig(prisma, jobId, previewPath);
  if (widgetConfig) {
    html = injectWidget(html, { config: widgetConfig, apiBaseUrl: appUrl });
  }

  return (
    <html>
      <body dangerouslySetInnerHTML={{ __html: html }} />
    </html>
  );
}
