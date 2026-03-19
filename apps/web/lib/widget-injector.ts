import type { WidgetPreviewConfig } from "@/lib/widget-config-builder";

export interface InjectionOptions {
  config: WidgetPreviewConfig;
  apiBaseUrl: string;
  skipNoticeBanner?: boolean;
}

export function injectWidget(html: string, options: InjectionOptions): string {
  const { config, apiBaseUrl, skipNoticeBanner } = options;
  const configJson = JSON.stringify(config);

  const widgetHtml = `
<div id="zapsight-widget-root"></div>
<script>
  window.__ZAPSIGHT_PREVIEW_CONFIG__ = ${configJson};
  window.__ZAPSIGHT_API_BASE__ = '${apiBaseUrl}';
</script>
<script src="${apiBaseUrl}/api/widget/preview-bundle.js"></script>
<style>
  /* === ZapSight Preview: Reset store interference === */

  /* Always allow scrolling — stores lock body scroll for their modals */
  html, body { overflow: auto !important; }

  /* Nuke common popup/modal/overlay patterns baked into scraped HTML */
  [class*="modal"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [class*="popup"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [class*="overlay"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [class*="dialog"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [class*="lightbox"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [id*="modal"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [id*="popup"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [id*="overlay"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab),
  [role="dialog"]:not(#zapsight-widget-panel):not(#zapsight-widget-tab) {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* When panel is open, push body content left so it's not hidden under the panel */
  body.zs-panel-open {
    margin-right: 380px !important;
    transition: margin-right 0.3s ease;
  }
  body {
    transition: margin-right 0.3s ease;
  }

  @keyframes zs-tab-pulse {
    0%   { box-shadow: -2px 0 12px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.5); }
    70%  { box-shadow: -2px 0 12px rgba(79,70,229,0.4), 0 0 0 10px rgba(79,70,229,0); }
    100% { box-shadow: -2px 0 12px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0); }
  }
  #zapsight-widget-tab {
    all: unset;
    position: fixed !important;
    right: 0 !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    z-index: 99999 !important;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    color: white !important;
    border: none !important;
    border-radius: 12px 0 0 12px !important;
    padding: 16px 8px !important;
    cursor: pointer !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 8px !important;
    box-shadow: -2px 0 12px rgba(79,70,229,0.4) !important;
    transition: opacity 0.3s ease, right 0.3s ease !important;
    animation: zs-tab-pulse 2s ease-in-out 1s 3 !important;
    box-sizing: border-box !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    text-transform: none !important;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  #zapsight-widget-tab:hover {
    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
  }
  #zapsight-widget-tab.hidden {
    right: -80px;
    opacity: 0;
    pointer-events: none;
  }
  .zs-tab-icon {
    font-size: 20px;
  }
  .zs-tab-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    writing-mode: vertical-rl;
    opacity: 0.9;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  #zapsight-widget-panel {
    position: fixed;
    top: 0;
    right: -420px;
    width: 380px;
    height: 100vh;
    background: #0f0f1a;
    z-index: 99998;
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: -4px 0 24px rgba(0,0,0,0.4);
  }
  #zapsight-widget-panel.open {
    right: 0;
  }
  .zs-header {
    padding: 18px 20px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .zs-header-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .zs-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 700;
    color: white;
  }
  .zs-brand-icon {
    font-size: 20px;
  }
  .zs-store-name {
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    margin-top: 2px;
  }
  .zs-header-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .zs-restart-btn {
    all: unset;
    background: rgba(220,38,38,0.15) !important;
    border: 1px solid rgba(220,38,38,0.3) !important;
    color: #f87171 !important;
    border-radius: 20px !important;
    padding: 5px 12px !important;
    font-size: 12px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    line-height: 1.4 !important;
    box-sizing: border-box !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  .zs-close-btn {
    all: unset;
    background: none !important;
    border: none !important;
    color: rgba(255,255,255,0.5) !important;
    cursor: pointer !important;
    font-size: 20px !important;
    padding: 2px 6px !important;
    line-height: 1 !important;
    box-sizing: border-box !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
  }
  .zs-greeting {
    padding: 40px 24px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .zs-greeting-title {
    font-size: 28px;
    font-weight: 800;
    color: white;
    margin-bottom: 10px;
    line-height: 1.2;
  }
  .zs-greeting-subtitle {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
    margin-bottom: 0;
  }
  .zs-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }
  .zs-message {
    padding: 10px 14px;
    border-radius: 14px;
    max-width: 88%;
    font-size: 14px;
    line-height: 1.5;
  }
  .zs-message.bot {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.9);
    align-self: flex-start;
    border-radius: 4px 14px 14px 14px;
  }
  .zs-message.user {
    background: #4f46e5;
    color: white;
    align-self: flex-end;
    border-radius: 14px 4px 14px 14px;
  }
  .zs-suggestions {
    padding: 0 20px 16px;
  }
  .zs-suggestions-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.35);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .zs-suggestions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  .zs-chip {
    all: unset;
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 12px !important;
    padding: 10px 8px !important;
    cursor: pointer !important;
    color: white !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    text-align: left !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    box-sizing: border-box !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    text-transform: none !important;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  .zs-chip:hover {
    background: rgba(255,255,255,0.1) !important;
  }
  .zs-chip-icon {
    font-size: 18px !important;
  }
  .zs-input-row {
    padding: 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    gap: 10px;
    align-items: center;
    background: #0f0f1a;
  }
  .zs-input {
    flex: 1;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 10px 18px;
    font-size: 14px;
    color: white;
    outline: none;
  }
  .zs-input::placeholder {
    color: rgba(255,255,255,0.3);
  }
  .zs-send {
    all: unset;
    background: #4f46e5 !important;
    border: none !important;
    border-radius: 50% !important;
    width: 40px !important;
    height: 40px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    flex-shrink: 0 !important;
    box-sizing: border-box !important;
    min-width: 0 !important;
    max-width: none !important;
    text-transform: none !important;
  }
  .zs-send:hover {
    background: #4338ca !important;
  }
  .zs-domain-pill {
    text-align: center;
    padding: 8px 16px 12px;
    font-size: 11px;
    color: rgba(255,255,255,0.25);
  }
  .zs-domain-pill span {
    background: rgba(255,255,255,0.06);
    border-radius: 20px;
    padding: 4px 12px;
  }
</style>
<script>
(function() {
  var config = window.__ZAPSIGHT_PREVIEW_CONFIG__;
  if (!config) return;

  var storeName = config.storeContext ? config.storeContext.storeName : 'this store';
  var productTypes = (config.storeContext && config.storeContext.productTypes && config.storeContext.productTypes.length)
    ? config.storeContext.productTypes
    : null;
  var productType = productTypes ? productTypes[0] : ((config.storeContext && config.storeContext.productType) ? config.storeContext.productType : 'product');

  // Build context-aware chip prompts from productTypes
  var chipSets = {
    furniture: [
      { icon: '\\uD83D\\uDECB\\uFE0F', text: 'Help me find a sofa' },
      { icon: '\\uD83D\\uDECF\\uFE0F', text: 'Show me bedroom furniture' },
      { icon: '\\uD83D\\uDCB0', text: 'What\\u0027s on sale right now?' },
    ],
    mattress: [
      { icon: '\\uD83D\\uDECF\\uFE0F', text: 'Help me find the perfect mattress' },
      { icon: '\\u2744\\uFE0F', text: 'Show me cooling mattresses' },
      { icon: '\\uD83D\\uDCB0', text: 'What\\u0027s on sale right now?' },
    ],
    default: [
      { icon: '\\uD83D\\uDD0D', text: 'Help me find the right product' },
      { icon: '\\uD83D\\uDCB0', text: 'What\\u0027s on sale right now?' },
      { icon: '\\u2B50', text: 'Show me your best sellers' },
    ],
  };
  function getChips() {
    if (!productTypes) return chipSets.default;
    var joined = productTypes.join(' ').toLowerCase();
    if (joined.includes('sofa') || joined.includes('furniture') || joined.includes('chair') || joined.includes('dining') || joined.includes('bedroom')) return chipSets.furniture;
    if (joined.includes('mattress') || joined.includes('sleep') || joined.includes('bed')) return chipSets.mattress;
    return chipSets.default;
  }
  var chips = getChips();
  var chipsHtml = chips.map(function(c) {
    return '<button class="zs-chip" data-text="' + c.text + '"><span class="zs-chip-icon">' + c.icon + '</span> ' + c.text + '</button>';
  }).join('');
  var domain = config.normalizedDomain || '';
  var state = 'greeting'; // 'greeting' or 'conversation'
  var messageCount = 0;
  var ctaShown = false;
  var conversationHistory = [];

  // --- Tab ---
  var tab = document.createElement('button');
  tab.id = 'zapsight-widget-tab';
  tab.innerHTML = '<span class="zs-tab-icon">\\uD83D\\uDCAC</span><span class="zs-tab-label">AI Help</span>';
  tab.title = 'Open AI Shopping Assistant';
  document.body.appendChild(tab);

  // --- Panel ---
  var panel = document.createElement('div');
  panel.id = 'zapsight-widget-panel';
  panel.innerHTML =
    '<div class="zs-header">' +
      '<div class="zs-header-left">' +
        '<div class="zs-brand"><span class="zs-brand-icon">\\u2728</span> ShopPilot</div>' +
        '<div class="zs-store-name">' + escapeHtml(storeName) + '</div>' +
      '</div>' +
      '<div class="zs-header-right">' +
        '<button class="zs-restart-btn" id="zs-restart">\\u21BA Start Over</button>' +
        '<button class="zs-close-btn" id="zs-close">\\u00D7</button>' +
      '</div>' +
    '</div>' +
    '<div id="zs-greeting" class="zs-greeting">' +
      '<div class="zs-greeting-title">Hi there \\uD83D\\uDC4B</div>' +
      '<div class="zs-greeting-subtitle">Your AI shopping assistant \\u2014 here to help you find the perfect ' + escapeHtml(productType) + ' \\uD83C\\uDF19\\u2728</div>' +
    '</div>' +
    '<div class="zs-messages" id="zs-messages" style="display:none;"></div>' +
    '<div class="zs-suggestions" id="zs-suggestions">' +
      '<div class="zs-suggestions-label">\\u2728 Try asking</div>' +
      '<div class="zs-suggestions-grid">' +
        chipsHtml +
      '</div>' +
    '</div>' +
    '<div class="zs-input-row">' +
      '<input class="zs-input" id="zs-input" placeholder="What are you looking for?" />' +
      '<button class="zs-send" id="zs-send">\\u27A4</button>' +
    '</div>' +
    '<div class="zs-domain-pill"><span>' + escapeHtml(domain) + '</span></div>';
  document.body.appendChild(panel);

  // --- Toggle ---
  tab.addEventListener('click', function() {
    var isOpen = panel.classList.toggle('open');
    tab.classList.toggle('hidden', isOpen);
    document.body.classList.toggle('zs-panel-open', isOpen);
    if (isOpen) {
      document.getElementById('zs-input').focus();
      logEvent('widget_opened');
    }
  });

  // --- Close ---
  document.getElementById('zs-close').addEventListener('click', function() {
    panel.classList.remove('open');
    tab.classList.remove('hidden');
    document.body.classList.remove('zs-panel-open');
  });

  // --- Start Over ---
  document.getElementById('zs-restart').addEventListener('click', function() {
    document.getElementById('zs-messages').innerHTML = '';
    document.getElementById('zs-messages').style.display = 'none';
    document.getElementById('zs-greeting').style.display = 'flex';
    document.getElementById('zs-suggestions').style.display = 'block';
    state = 'greeting';
    messageCount = 0;
    ctaShown = false;
  });

  // --- Chips ---
  var chips = document.querySelectorAll('.zs-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].addEventListener('click', function() {
      var text = this.getAttribute('data-text');
      if (text) {
        document.getElementById('zs-input').value = text;
        sendMessage();
      }
    });
  }

  // --- Send ---
  function sendMessage() {
    var input = document.getElementById('zs-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    if (state === 'greeting') {
      state = 'conversation';
      document.getElementById('zs-greeting').style.display = 'none';
      document.getElementById('zs-suggestions').style.display = 'none';
      document.getElementById('zs-messages').style.display = 'flex';
    }

    appendMessage(text, 'user');
    logEvent('message_sent', { text: text });
    messageCount++;

    // Show typing indicator
    var typingId = 'zs-typing-' + Date.now();
    var typingEl = document.createElement('div');
    typingEl.id = typingId;
    typingEl.className = 'zs-message bot';
    typingEl.innerHTML = '<span style="opacity:0.5;letter-spacing:2px;">&#8226;&#8226;&#8226;</span>';
    typingEl.style.fontStyle = 'italic';
    document.getElementById('zs-messages').appendChild(typingEl);
    document.getElementById('zs-messages').scrollTop = document.getElementById('zs-messages').scrollHeight;

    fetch((window.__ZAPSIGHT_API_BASE__ || '') + '/api/widget/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory,
        storeContext: config.storeContext,
        pageContext: config.pageContext,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var reply = data.reply || 'Happy to help! What are you looking for?';
      var typing = document.getElementById(typingId);
      if (typing) typing.remove();
      conversationHistory.push({ role: 'user', content: text });
      conversationHistory.push({ role: 'assistant', content: reply });
      appendMessage(reply, 'bot');
      if (messageCount === 2 && !ctaShown) {
        ctaShown = true;
        appendCTA();
      }
    })
    .catch(function() {
      var typing = document.getElementById(typingId);
      if (typing) typing.remove();
      appendMessage('Sorry, I hit a snag — try again in a moment!', 'bot');
    });
  }

  document.getElementById('zs-send').addEventListener('click', sendMessage);
  document.getElementById('zs-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  function appendCTA() {
    var msgs = document.getElementById('zs-messages');
    var el = document.createElement('div');
    el.style.cssText = 'background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 14px; padding: 14px 16px; margin-top: 4px; color: white; font-size: 13px; line-height: 1.5;';
    el.innerHTML = '<div style="font-weight:700;margin-bottom:6px;">\\u2728 Want this on your actual store?</div><div style="opacity:0.85;margin-bottom:12px;">See Shop Pilot live on your real inventory in a 15-minute call.</div><a href="https://calendly.com/blake-zapsight/30min" target="_blank" id="zs-cta-link" style="display:block;background:white;color:#4f46e5;text-align:center;padding:8px 0;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;">Book a 15-Min Call \\u2192</a>';
    msgs.appendChild(el);
    document.getElementById('zs-cta-link').addEventListener('click', function() {
      logEvent('cta_clicked', { destination: 'calendly' });
    });
    msgs.scrollTop = msgs.scrollHeight;
    logEvent('cta_shown', { trigger: 'after_2_messages' });
  }

  function appendMessage(text, type) {
    var msgs = document.getElementById('zs-messages');
    var el = document.createElement('div');
    el.className = 'zs-message ' + type;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function logEvent(name, payload) {
    var previewJobId = config.previewJobId;
    if (!previewJobId) return;
    fetch((window.__ZAPSIGHT_API_BASE__ || '') + '/api/preview-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewJobId: previewJobId, eventName: name, eventPayload: payload || {} })
    }).catch(function() {});
  }

  logEvent('widget_loaded', { pageType: config.pageContext ? config.pageContext.pageType : 'unknown' });

  // Notice bar is injected server-side (see injectWidget TypeScript code below)

  // Kill popups/modals baked into scraped HTML
  function killPopups() {
    var selectors = [
      '[class*="modal"]', '[class*="popup"]', '[class*="overlay"]',
      '[class*="lightbox"]', '[class*="newsletter"]', '[class*="email-capture"]',
      '[id*="modal"]', '[id*="popup"]', '[id*="overlay"]',
      '[role="dialog"]'
    ];
    selectors.forEach(function(sel) {
      try {
        document.querySelectorAll(sel).forEach(function(el) {
          if (el.id && el.id.startsWith('zapsight')) return; // never touch our own elements
          var style = window.getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'absolute') {
            var z = parseInt(style.zIndex) || 0;
            if (z > 100 && z < 99990) { // only kill store modals, not our widget
              el.style.display = 'none';
            }
          }
        });
      } catch(e) {}
    });
    // Always restore scroll
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  // Run immediately + after short delay (for JS-injected modals)
  killPopups();
  setTimeout(killPopups, 500);
  setTimeout(killPopups, 1500);
})();
</script>`;

  // Server-side notice banner — injected into HTML directly so store CSS/JS can't interfere
  let result = html;
  if (!skipNoticeBanner) {
    const domain = config.normalizedDomain || config.storeContext?.domain || "";
    const noticeBanner = domain ? `
<div id="zs-preview-notice" style="position:fixed;top:0;left:0;right:0;z-index:99995;background:linear-gradient(90deg,#1a1a1a,#1e1a2e);color:rgba(255,255,255,0.85);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08);gap:16px;flex-wrap:wrap;">
  <span style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
    <span style="font-size:16px;">⚡</span>
    <span>This is a <strong style="color:#ff6b35;">ZapSight preview</strong> of <strong style="color:white">${domain}</strong> — see how Shop Pilot would look on your real store.</span>
  </span>
  <span style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
    <a href="https://calendly.com/blake-zapsight/30min" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ff3d7f);color:white;font-weight:700;font-size:12px;padding:7px 16px;border-radius:20px;text-decoration:none;white-space:nowrap;">Book a Custom Demo →</a>
    <span onclick="this.closest('#zs-preview-notice').style.display='none';document.body.style.paddingTop='0'" style="color:rgba(255,255,255,0.35);cursor:pointer;font-size:20px;padding:0 6px;line-height:1;user-select:none;">×</span>
  </span>
</div>
<script>document.body.style.paddingTop='53px';</script>` : "";

    const bodyOpenIndex = result.indexOf("<body");
    const bodyTagEnd = bodyOpenIndex !== -1 ? result.indexOf(">", bodyOpenIndex) + 1 : -1;
    if (bodyTagEnd > 0 && noticeBanner) {
      result = result.slice(0, bodyTagEnd) + noticeBanner + result.slice(bodyTagEnd);
    }
  }

  // Inject widget before </body> or append to end
  const bodyCloseIndex = result.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return result.slice(0, bodyCloseIndex) + widgetHtml + result.slice(bodyCloseIndex);
  }
  return result + widgetHtml;
}
