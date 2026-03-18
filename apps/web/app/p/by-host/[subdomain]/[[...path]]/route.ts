import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageAdapter } from "@zapsight/storage";
import { getRenderedPageForPath, rewriteHtml } from "@zapsight/preview";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";

function toDisplayName(s: string) {
  return s.replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bAnd\b/g,"&").replace(/\bUs\b/g,"US").replace(/\bUsa\b/g,"USA");
}

function notFoundHtml(subdomain: string, storeUrl: string) {
  const d = toDisplayName(subdomain);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZapSight Preview — ${d}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}.logo{display:flex;align-items:center;gap:10px;margin-bottom:48px}.logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}.logo-text{font-size:20px;font-weight:700}.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:48px 40px;max-width:520px;width:100%;text-align:center}.store-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.25);border-radius:30px;padding:6px 16px;font-size:13px;color:#ff6b35;font-weight:600;margin-bottom:24px}h1{font-size:28px;font-weight:800;line-height:1.2;margin-bottom:12px}.sub{font-size:15px;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:32px}.highlight{color:#fff;font-weight:600}.form-row{display:flex;gap:10px;margin-bottom:16px}.input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 16px;font-size:14px;color:#fff;outline:none}.input::placeholder{color:rgba(255,255,255,.3)}.btn{background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;border:none;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap}.divider{display:flex;align-items:center;gap:12px;margin:24px 0;color:rgba(255,255,255,.2);font-size:12px}.divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08)}.demo-link{display:block;text-align:center;color:rgba(255,255,255,.4);font-size:13px;text-decoration:none}.demo-link span{color:#ff6b35;font-weight:600}.features{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:32px;padding-top:32px;border-top:1px solid rgba(255,255,255,.06)}.feature{text-align:center}.feature-icon{font-size:22px;margin-bottom:6px}.feature-text{font-size:11px;color:rgba(255,255,255,.4);line-height:1.4}</style></head><body><div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">ZapSight</span></div><div class="card"><div class="store-badge">✨ ${d}</div><h1>See Shop Pilot on<br><span style="color:#ff6b35">${d}</span></h1><p class="sub">Enter your email and we'll build a live preview of our AI shopping assistant on your store — <span class="highlight">no install, no commitment.</span></p><form action="/api/preview-jobs" method="POST"><input type="hidden" name="url" value="${storeUrl}"><div class="form-row"><input class="input" type="email" name="email" placeholder="your@email.com" required><button class="btn" type="submit">Build Preview →</button></div></form><div class="divider">or</div><a href="https://calendly.com/blake-zapsight/30min" class="demo-link" target="_blank">Prefer a live demo? <span>Book 15 minutes →</span></a><div class="features"><div class="feature"><div class="feature-icon">⚡</div><div class="feature-text">Ready in 60 seconds</div></div><div class="feature"><div class="feature-icon">🛍️</div><div class="feature-text">Your store, your catalog</div></div><div class="feature"><div class="feature-icon">🔒</div><div class="feature-text">No install required</div></div></div></div></body></html>`;
}

function buildingHtml(subdomain: string, jobId: string) {
  const d = toDisplayName(subdomain);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zapsight.us";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Building your preview — ${d}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}.logo{display:flex;align-items:center;gap:10px;margin-bottom:48px}.logo-icon{width:40px;height:40px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}.logo-text{font-size:20px;font-weight:700}.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:48px 40px;max-width:480px;width:100%;text-align:center}.store-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,107,53,.12);border:1px solid rgba(255,107,53,.25);border-radius:30px;padding:6px 16px;font-size:13px;color:#ff6b35;font-weight:600;margin-bottom:24px}h1{font-size:26px;font-weight:800;margin-bottom:12px}.sub{font-size:15px;color:rgba(255,255,255,.5);margin-bottom:36px;line-height:1.6}.progress-wrap{background:rgba(255,255,255,.06);border-radius:100px;height:6px;margin-bottom:12px;overflow:hidden}.progress-bar{height:100%;border-radius:100px;background:linear-gradient(90deg,#ff6b35,#f7931e);animation:prog 3s ease-in-out infinite}@keyframes prog{0%{width:15%}50%{width:75%}100%{width:95%}}.status{font-size:13px;color:rgba(255,255,255,.35);margin-bottom:32px}.steps{text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:32px}.step{display:flex;align-items:center;gap:12px;font-size:14px;color:rgba(255,255,255,.5)}.step.done{color:rgba(255,255,255,.85)}.step-icon{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}.step.done .step-icon{background:rgba(74,222,128,.15);color:#4ade80}.step.active .step-icon{background:rgba(255,107,53,.15);color:#ff6b35;animation:pulse 1.5s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.notify-link{display:block;color:rgba(255,255,255,.35);font-size:13px;text-decoration:none;margin-top:4px}.notify-link span{color:#ff6b35}</style><script>setTimeout(function(){window.location.reload()},8000)</script></head><body><div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">ZapSight</span></div><div class="card"><div class="store-badge">✨ ${d}</div><h1>Building your preview…</h1><p class="sub">We're setting up Shop Pilot on <strong style="color:#fff">${d}</strong>. This takes about 60 seconds.</p><div class="progress-wrap"><div class="progress-bar"></div></div><p class="status">Analyzing your store catalog…</p><div class="steps"><div class="step done"><div class="step-icon">✓</div>Store URL received</div><div class="step done"><div class="step-icon">✓</div>Catalog pages discovered</div><div class="step active"><div class="step-icon">⚡</div>Building AI context</div><div class="step"><div class="step-icon">○</div>Injecting Shop Pilot widget</div><div class="step"><div class="step-icon">○</div>Preview ready</div></div><a href="${appUrl}/preview-jobs/${jobId}" class="notify-link">View detailed status <span>→</span></a></div></body></html>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; path?: string[] }> }
) {
  const { subdomain, path } = await params;
  const previewPath = path ? "/" + path.join("/") : "/";
  const hostname = `${subdomain}.zapsight.us`;
  const storeUrl = `https://${subdomain.replace(/-/g, "")}.com`;

  const previewHost = await prisma.previewHost.findUnique({
    where: { hostname },
    include: { previewJob: true },
  });

  if (!previewHost || !previewHost.active) {
    return new NextResponse(notFoundHtml(subdomain, storeUrl), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const jobId = previewHost.previewJobId;
  const job = previewHost.previewJob;

  if (job?.status && !["PREVIEW_READY", "RENDER_COMPLETE", "READY"].includes(job.status)) {
    return new NextResponse(buildingHtml(subdomain, jobId), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const storage = getStorageAdapter();
  const result = await getRenderedPageForPath(prisma, storage, jobId, previewPath);

  if (!result) {
    return new NextResponse(buildingHtml(subdomain, jobId), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const domain = job?.normalizedDomain ?? subdomain;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zapsight.us";

  let html = rewriteHtml(result.html, {
    previewJobId: jobId,
    originalDomain: domain,
    previewBasePath: "",
    mode: "subdomain",
  });

  const widgetConfig = await buildWidgetConfig(jobId, previewPath);
  if (widgetConfig) {
    html = injectWidget(html, { config: widgetConfig, apiBaseUrl: appUrl });
  }

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
