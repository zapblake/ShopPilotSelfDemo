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
  #zapsight-widget-launcher {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  #zapsight-widget-panel {
    position: fixed;
    bottom: 96px;
    right: 24px;
    z-index: 99998;
    width: 360px;
    max-height: 500px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    display: none;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  #zapsight-widget-panel.open { display: flex; }
  .zs-header { background: #1a1a2e; color: white; padding: 16px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
  .zs-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .zs-message { padding: 8px 12px; border-radius: 12px; max-width: 85%; font-size: 14px; line-height: 1.4; }
  .zs-message.bot { background: #f0f0f0; align-self: flex-start; }
  .zs-message.user { background: #1a1a2e; color: white; align-self: flex-end; }
  .zs-input-row { padding: 12px; border-top: 1px solid #eee; display: flex; gap: 8px; }
  .zs-input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; }
  .zs-send { background: #1a1a2e; color: white; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 14px; }
  .zs-demo-badge { position: fixed; top: 60px; right: 12px; background: rgba(255,107,53,0.9); color: white; font-size: 11px; padding: 4px 8px; border-radius: 4px; z-index: 99999; font-family: sans-serif; }
</style>
<script>
(function() {
  var config = window.__ZAPSIGHT_PREVIEW_CONFIG__;
  if (!config) return;

  // Demo badge
  if (config.demoFlags && config.demoFlags.showDemoBadge) {
    var badge = document.createElement('div');
    badge.id = 'zs-demo-badge';
    badge.className = 'zs-demo-badge';
    badge.textContent = '\\u2728 ZapSight Preview';
    document.body.appendChild(badge);
  }

  // Launcher button
  var launcher = document.createElement('button');
  launcher.id = 'zapsight-widget-launcher';
  launcher.textContent = '\\uD83D\\uDCAC';
  launcher.title = 'Chat with AI Shopping Assistant';
  document.body.appendChild(launcher);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'zapsight-widget-panel';

  var storeName = config.storeContext ? config.storeContext.storeName : 'this store';
  var greeting = (config.demoFlags && config.demoFlags.greetingOverride)
    || ("Hi! I'm the AI shopping assistant for " + storeName + ". How can I help you today?");

  panel.innerHTML = '<div class="zs-header"><span>AI Shopping Assistant</span><button onclick="document.getElementById(\\'zapsight-widget-panel\\').classList.remove(\\'open\\')" style="background:none;border:none;color:white;cursor:pointer;font-size:18px">\\u00D7</button></div><div class="zs-messages" id="zs-messages"><div class="zs-message bot">' + greeting + '</div></div><div class="zs-input-row"><input class="zs-input" id="zs-input" placeholder="Ask about products..." /><button class="zs-send" id="zs-send">Send</button></div>';
  document.body.appendChild(panel);

  // Toggle
  launcher.addEventListener('click', function() {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      document.getElementById('zs-input').focus();
      logEvent('widget_opened');
    }
  });

  // Send message
  function sendMessage() {
    var input = document.getElementById('zs-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendMessage(text, 'user');
    logEvent('message_sent', { text: text });
    setTimeout(function() {
      var response = getDemoResponse(text, config);
      appendMessage(response, 'bot');
    }, 600);
  }

  document.getElementById('zs-send').addEventListener('click', sendMessage);
  document.getElementById('zs-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  function appendMessage(text, type) {
    var msgs = document.getElementById('zs-messages');
    var el = document.createElement('div');
    el.className = 'zs-message ' + type;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
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
