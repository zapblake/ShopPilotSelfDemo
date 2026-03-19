import type { WidgetPreviewConfig } from "@/lib/widget-config-builder";

export interface InjectionOptions {
  config: WidgetPreviewConfig;
  apiBaseUrl: string;
}

export function injectWidget(html: string, options: InjectionOptions): string {
  const { config, apiBaseUrl } = options;
  const configJson = JSON.stringify(config);

  const widgetHtml = `
<div id="zapsight-widget-root"></div>
<script>
  window.__ZAPSIGHT_PREVIEW_CONFIG__ = ${configJson};
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
  var productType = (config.storeContext && config.storeContext.productType) ? config.storeContext.productType : 'product';
  var domain = config.normalizedDomain || '';
  var state = 'greeting'; // 'greeting' or 'conversation'
  var messageCount = 0;
  var ctaShown = false;

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
        '<button class="zs-chip" data-text="Help me find the perfect mattress"><span class="zs-chip-icon">\\uD83D\\uDECF\\uFE0F</span> Help me find the perfect mattress</button>' +
        '<button class="zs-chip" data-text="Show me cooling mattresses"><span class="zs-chip-icon">\\u2744\\uFE0F</span> Show me cooling mattresses</button>' +
        '<button class="zs-chip" data-text="What\\u0027s on sale right now?"><span class="zs-chip-icon">\\uD83D\\uDCB0</span> What\\u0027s on sale right now?</button>' +
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
    setTimeout(function() {
      var response = getDemoResponse(text, config);
      appendMessage(response, 'bot');
      if (messageCount === 2 && !ctaShown) {
        ctaShown = true;
        appendCTA();
      }
    }, 600);
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

  function getDemoResponse(text, cfg) {
    var lower = text.toLowerCase();
    var name = cfg.storeContext ? cfg.storeContext.storeName : 'this store';
    if (lower.includes('mattress') || lower.includes('sleep') || lower.includes('bed')) {
      return 'Great question! ' + name + ' has a great selection of mattresses. Would you like me to help narrow down options based on your sleep style?';
    }
    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      return 'Prices vary by model and size. I can help you find the best value based on your needs \\u2014 what are your top priorities?';
    }
    if (lower.includes('delivery') || lower.includes('shipping')) {
      return name + ' offers delivery options including white glove setup. Would you like more details on delivery to your area?';
    }
    if (lower.includes('return') || lower.includes('refund')) {
      return 'Most products come with a comfort trial period. I\\'d recommend confirming the specific return policy on the product page.';
    }
    return 'I\\'d be happy to help you find the right product at ' + name + '! Could you tell me more about what you\\'re looking for?';
  }

  function logEvent(name, payload) {
    var previewJobId = config.previewJobId;
    if (!previewJobId) return;
    fetch('/api/preview-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewJobId: previewJobId, eventName: name, eventPayload: payload || {} })
    }).catch(function() {});
  }

  logEvent('widget_loaded', { pageType: config.pageContext ? config.pageContext.pageType : 'unknown' });

  // --- Preview notice bar (shown on all real previews) ---
  var noticeDomain = config.normalizedDomain || (config.storeContext && config.storeContext.domain) || '';
  if (noticeDomain && !document.getElementById('zs-preview-notice')) {
    var notice = document.createElement('div');
    notice.id = 'zs-preview-notice';
    notice.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99990;background:linear-gradient(90deg,#1a1a1a,#1e1a2e);color:rgba(255,255,255,0.85);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08);gap:16px;flex-wrap:wrap;';
    notice.innerHTML =
      '<span style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">' +
        '<span style="font-size:16px;">⚡</span>' +
        '<span>This is a <strong style="color:#ff6b35;">ZapSight preview</strong> of <strong style="color:white">' + escapeHtml(noticeDomain) + '</strong> — showing how Shop Pilot would look on your real store.</span>' +
      '</span>' +
      '<span style="display:flex;align-items:center;gap:10px;flex-shrink:0;">' +
        '<a href="https://calendly.com/blake-zapsight/30min" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ff3d7f);color:white;font-weight:700;font-size:12px;padding:7px 16px;border-radius:20px;text-decoration:none;white-space:nowrap;">Book a Custom Demo →</a>' +
        '<button id="zs-notice-close" style="all:unset;color:rgba(255,255,255,0.35);cursor:pointer;font-size:18px;padding:0 4px;line-height:1;">×</button>' +
      '</span>';
    document.body.prepend(notice);
    document.body.style.paddingTop = '53px';
    document.getElementById('zs-notice-close').addEventListener('click', function() {
      notice.style.display = 'none';
      document.body.style.paddingTop = '0';
    });
  }

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

  // Inject before </body> or append to end
  const bodyCloseIndex = html.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return html.slice(0, bodyCloseIndex) + widgetHtml + html.slice(bodyCloseIndex);
  }
  return html + widgetHtml;
}
