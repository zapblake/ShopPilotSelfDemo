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
  @keyframes zs-tab-pulse {
    0%   { box-shadow: -2px 0 12px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.5); }
    70%  { box-shadow: -2px 0 12px rgba(79,70,229,0.4), 0 0 0 10px rgba(79,70,229,0); }
    100% { box-shadow: -2px 0 12px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0); }
  }
  #zapsight-widget-tab {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 99999;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 12px 0 0 12px;
    padding: 16px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    box-shadow: -2px 0 12px rgba(79,70,229,0.4);
    transition: transform 0.3s ease, opacity 0.3s ease, right 0.3s ease;
    animation: zs-tab-pulse 2s ease-in-out 1s 3;
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
    background: rgba(220,38,38,0.15);
    border: 1px solid rgba(220,38,38,0.3);
    color: #f87171;
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .zs-close-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    font-size: 20px;
    padding: 2px 6px;
    line-height: 1;
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
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 10px 8px;
    cursor: pointer;
    color: white;
    font-size: 12px;
    line-height: 1.4;
    text-align: left;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .zs-chip:hover {
    background: rgba(255,255,255,0.1);
  }
  .zs-chip-icon {
    font-size: 18px;
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
    background: #4f46e5;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .zs-send:hover {
    background: #4338ca;
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
    if (isOpen) {
      document.getElementById('zs-input').focus();
      logEvent('widget_opened');
    }
  });

  // --- Close ---
  document.getElementById('zs-close').addEventListener('click', function() {
    panel.classList.remove('open');
    tab.classList.remove('hidden');
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
})();
</script>`;

  // Inject before </body> or append to end
  const bodyCloseIndex = html.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return html.slice(0, bodyCloseIndex) + widgetHtml + html.slice(bodyCloseIndex);
  }
  return html + widgetHtml;
}
