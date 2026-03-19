import { prisma } from "@/lib/prisma";
import { buildWidgetConfig } from "@/lib/widget-config-builder";
import { injectWidget } from "@/lib/widget-injector";

interface DemoPageProps {
  params: Promise<{ jobId: string }>;
}

const FAKE_STORE_HTML = (storeName: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${storeName} — Furniture & Home</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #fafaf8; color: #1a1a1a; }

    /* === NAV === */
    nav {
      background: #fff;
      border-bottom: 1px solid #e8e8e4;
      padding: 0 40px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #1a1a1a; }
    .nav-logo span { color: #c8a96e; }
    .nav-links { display: flex; gap: 32px; list-style: none; }
    .nav-links a { text-decoration: none; color: #555; font-size: 14px; font-weight: 500; }
    .nav-links a:hover { color: #1a1a1a; }
    .nav-right { display: flex; gap: 16px; align-items: center; }
    .nav-cart { background: #1a1a1a; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }

    /* === HERO === */
    .hero {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2a24 100%);
      color: white;
      padding: 80px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
      min-height: 420px;
    }
    .hero-content { max-width: 540px; }
    .hero-tag { display: inline-block; background: rgba(200,169,110,0.2); border: 1px solid rgba(200,169,110,0.4); color: #c8a96e; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 100px; margin-bottom: 20px; }
    .hero h1 { font-size: clamp(32px, 4vw, 52px); font-weight: 800; line-height: 1.1; letter-spacing: -1.5px; margin-bottom: 16px; }
    .hero h1 span { color: #c8a96e; }
    .hero p { font-size: 17px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 28px; }
    .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn-primary { background: #c8a96e; color: #1a1a1a; border: none; border-radius: 10px; padding: 13px 28px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .btn-outline { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; padding: 13px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .hero-img {
      width: 380px; height: 280px; flex-shrink: 0;
      background: linear-gradient(135deg, #3d3830 0%, #2a2520 100%);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 80px;
    }

    /* === PROMO BAR === */
    .promo-bar { background: #c8a96e; color: #1a1a1a; text-align: center; padding: 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }

    /* === SECTION === */
    .section { padding: 60px 40px; }
    .section-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 32px; }
    .section-title { font-size: 28px; font-weight: 800; letter-spacing: -0.8px; }
    .section-link { font-size: 14px; color: #c8a96e; font-weight: 600; text-decoration: none; }

    /* === PRODUCT GRID === */
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; }
    .product-card { background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #eee; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
    .product-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .product-img { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 64px; }
    .product-info { padding: 16px; }
    .product-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .product-sub { font-size: 13px; color: #888; margin-bottom: 10px; }
    .product-price { font-size: 18px; font-weight: 800; color: #1a1a1a; }
    .product-old-price { font-size: 13px; color: #aaa; text-decoration: line-through; margin-left: 6px; font-weight: 400; }
    .product-badge { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle; }

    /* === CATEGORIES === */
    .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .cat-card { background: #fff; border-radius: 14px; padding: 28px 20px; text-align: center; border: 1px solid #eee; cursor: pointer; transition: border-color 0.15s; }
    .cat-card:hover { border-color: #c8a96e; }
    .cat-icon { font-size: 36px; margin-bottom: 10px; }
    .cat-name { font-size: 14px; font-weight: 600; }

    /* === BANNER === */
    .banner { background: linear-gradient(135deg, #1a1a1a, #2d2a24); color: white; border-radius: 20px; padding: 48px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .banner h2 { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
    .banner p { color: rgba(255,255,255,0.6); font-size: 15px; }

    /* === FOOTER === */
    footer { background: #1a1a1a; color: rgba(255,255,255,0.5); padding: 40px; text-align: center; font-size: 13px; }
    footer strong { color: white; }

    @media (max-width: 768px) {
      nav { padding: 0 20px; }
      .nav-links { display: none; }
      .hero { padding: 48px 20px; flex-direction: column; }
      .hero-img { width: 100%; }
      .section { padding: 40px 20px; }
      .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .banner { flex-direction: column; padding: 32px 24px; }
    }
  </style>
</head>
<body>

<div class="promo-bar">✨ Free White Glove Delivery on Orders Over $999 · Use Code PILOT10 for 10% Off</div>

<nav>
  <div class="nav-logo">${storeName.split(' ')[0]}<span>.</span></div>
  <ul class="nav-links">
    <li><a href="#">Living Room</a></li>
    <li><a href="#">Bedroom</a></li>
    <li><a href="#">Dining</a></li>
    <li><a href="#">Office</a></li>
    <li><a href="#">Sale</a></li>
  </ul>
  <div class="nav-right">
    <button class="nav-cart">🛒 Cart (0)</button>
  </div>
</nav>

<section class="hero">
  <div class="hero-content">
    <div class="hero-tag">New Arrivals 2026</div>
    <h1>Furniture that <span>feels like home</span></h1>
    <p>Discover handcrafted pieces designed for real living — from cozy sofas to statement dining sets, built to last.</p>
    <div class="hero-btns">
      <button class="btn-primary">Shop Now</button>
      <button class="btn-outline">View Lookbook →</button>
    </div>
  </div>
  <div class="hero-img">🛋️</div>
</section>

<section class="section" style="background:#fff;">
  <div class="section-header">
    <div class="section-title">Shop by Room</div>
  </div>
  <div class="cat-grid">
    <div class="cat-card"><div class="cat-icon">🛋️</div><div class="cat-name">Living Room</div></div>
    <div class="cat-card"><div class="cat-icon">🛏️</div><div class="cat-name">Bedroom</div></div>
    <div class="cat-card"><div class="cat-icon">🪑</div><div class="cat-name">Dining Room</div></div>
    <div class="cat-card"><div class="cat-icon">💼</div><div class="cat-name">Home Office</div></div>
  </div>
</section>

<section class="section">
  <div class="section-header">
    <div class="section-title">Bestsellers</div>
    <a href="#" class="section-link">View all →</a>
  </div>
  <div class="product-grid">
    <div class="product-card">
      <div class="product-img" style="background:#f5f0e8;">🛋️</div>
      <div class="product-info">
        <div class="product-name">Elmwood Sectional Sofa</div>
        <div class="product-sub">Performance Linen · 3 colors</div>
        <div><span class="product-price">$1,899</span><span class="product-old-price">$2,499</span><span class="product-badge">SALE</span></div>
      </div>
    </div>
    <div class="product-card">
      <div class="product-img" style="background:#eef2f0;">🪑</div>
      <div class="product-info">
        <div class="product-name">Harlow Accent Chair</div>
        <div class="product-sub">Boucle Fabric · Walnut legs</div>
        <div><span class="product-price">$649</span></div>
      </div>
    </div>
    <div class="product-card">
      <div class="product-img" style="background:#f8f4ee;">🛏️</div>
      <div class="product-info">
        <div class="product-name">Sedona Platform Bed</div>
        <div class="product-sub">Solid Oak · Queen & King</div>
        <div><span class="product-price">$1,299</span></div>
      </div>
    </div>
    <div class="product-card">
      <div class="product-img" style="background:#f0eef8;">🪞</div>
      <div class="product-info">
        <div class="product-name">Arched Mirror</div>
        <div class="product-sub">Brass frame · 65"</div>
        <div><span class="product-price">$399</span><span class="product-old-price">$549</span><span class="product-badge">SALE</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section" style="background:#fff;">
  <div class="banner">
    <div>
      <h2>Design your dream space</h2>
      <p>Book a free 30-min consultation with our design team — we'll help you find the perfect pieces.</p>
    </div>
    <button class="btn-primary" style="white-space:nowrap;flex-shrink:0;">Book Free Consult →</button>
  </div>
</section>

<footer>
  <strong>${storeName}</strong> · Free shipping over $999 · 30-day returns · (888) 555-0100
</footer>

</body>
</html>`;

export default async function DemoPage({ params }: DemoPageProps) {
  const { jobId } = await params;

  // Look up the job to get the store name
  const job = await prisma.previewJob.findUnique({
    where: { id: jobId },
    select: { normalizedDomain: true, widgetConfig: true },
  });

  const rawDomain = job?.normalizedDomain ?? "your store";
  const widgetCfg = job?.widgetConfig as Record<string, string> | null;
  const storeName = widgetCfg?.storeName || rawDomain.replace(/\.[^.]+$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Furniture";

  const baseHtml = FAKE_STORE_HTML(storeName);

  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://demo.zapsight.us";

  // Build widget config (or a fallback)
  let widgetConfig = await buildWidgetConfig(jobId, "/");
  if (!widgetConfig) {
    widgetConfig = {
      previewJobId: jobId,
      normalizedDomain: rawDomain,
      storeName,
      primaryColor: "#c8a96e",
      mode: "preview",
      promptContext: `You are a helpful AI shopping assistant for ${storeName}, a furniture store.`,
      storeContext: {
        storeName,
        domain: rawDomain,
        productTypes: ["furniture", "sofas", "beds", "chairs", "dining"],
        sampleProducts: [],
      },
      pageContext: {
        url: "/",
        path: "/",
        pageType: "home",
        title: "Home",
      },
      demoFlags: {
        isDemo: true,
        showDemoBadge: true,
        allowConversation: true,
        greetingOverride: `Hi! I'm the AI shopping assistant for ${storeName}. What can I help you find today?`,
      },
    };
  }

  const finalHtml = injectWidget(baseHtml, { config: widgetConfig, apiBaseUrl });

  // Insert the "bot protection" notice banner after <body>
  const noticeBanner = `
<div id="zs-notice" style="
  position: fixed; top: 0; left: 0; right: 0; z-index: 99990;
  background: linear-gradient(90deg, #1a1a1a 0%, #1e1a2e 100%);
  color: rgba(255,255,255,0.85);
  padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.08); gap: 16px; flex-wrap: wrap;
">
  <span style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
    <span style="font-size:16px;">🔒</span>
    <span><strong style="color:white">${rawDomain}</strong> uses bot protection, so this is a <strong style="color:#ff6b35;">rough demo</strong> on a sample store — not your real site. The actual integration looks much better.</span>
  </span>
  <span style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
    <a href="https://calendly.com/blake-zapsight/30min" target="_blank" style="
      display:inline-block; background:linear-gradient(135deg,#ff6b35,#ff3d7f);
      color:white; font-weight:700; font-size:12px; padding:7px 16px;
      border-radius:20px; text-decoration:none; white-space:nowrap;
    ">Book a Custom Demo →</a>
    <span onclick="document.getElementById('zs-notice').style.display='none';document.body.style.paddingTop='0'" style="color:rgba(255,255,255,0.35);cursor:pointer;font-size:20px;padding:0 6px;line-height:1;user-select:none;">×</span>
  </span>
</div>
<script>document.body.style.paddingTop='53px';</script>`;

  const skipFlag = `<script>window.__ZS_SKIP_NOTICE_BANNER__ = true;</script>`;
  const withNotice = finalHtml.replace("<body>", "<body>" + noticeBanner + skipFlag) || finalHtml + noticeBanner + skipFlag;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: withNotice }}
      suppressHydrationWarning
    />
  );
}
