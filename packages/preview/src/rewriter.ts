export interface RewriteOptions {
  previewJobId: string;
  originalDomain: string;
  previewBasePath: string; // e.g. "/p/[jobId]" for dev, "" for subdomain
  mode: "dev" | "subdomain";
  storeName?: string;
}

/**
 * Full HTML rewrite pipeline: base tag, link rewriting, form neutralization,
 * checkout script removal, and preview banner injection.
 */
export function rewriteHtml(html: string, options: RewriteOptions): string {
  let result = html;
  result = injectBase(result, options.originalDomain);
  result = rewriteLinks(result, options);
  result = neutralizeForms(result);
  result = neutralizeCheckoutScripts(result);
  result = injectBanner(result, options.previewJobId, options.storeName ?? options.originalDomain);
  return result;
}

/**
 * Rewrite <a href="..."> links to stay inside the preview.
 * - Internal absolute paths -> rewrite to preview path
 * - Links matching originalDomain -> rewrite to preview path
 * - External links -> leave href, add target="_blank"
 */
export function rewriteLinks(html: string, options: RewriteOptions): string {
  const { originalDomain, previewBasePath, mode } = options;
  const domainPattern = originalDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const domainRegex = new RegExp(`^https?://(www\\.)?${domainPattern}`, "i");

  return html.replace(
    /<a\s([^>]*?)href\s*=\s*"([^"]*)"([^>]*?)>/gi,
    (match, before: string, href: string, after: string) => {
      const trimmedHref = href.trim();

      // Anchor links or empty
      if (!trimmedHref || trimmedHref.startsWith("#") || trimmedHref.startsWith("mailto:") || trimmedHref.startsWith("tel:")) {
        return match;
      }

      // Link to same domain (full URL)
      if (domainRegex.test(trimmedHref)) {
        try {
          const url = new URL(trimmedHref);
          const rewritten = rewritePath(url.pathname, mode, previewBasePath);
          return `<a ${before}href="${rewritten}"${after}>`;
        } catch {
          return match;
        }
      }

      // Absolute path on same origin
      if (trimmedHref.startsWith("/")) {
        const rewritten = rewritePath(trimmedHref, mode, previewBasePath);
        return `<a ${before}href="${rewritten}"${after}>`;
      }

      // Relative path (no protocol, no leading slash)
      if (!trimmedHref.startsWith("http://") && !trimmedHref.startsWith("https://") && !trimmedHref.startsWith("//")) {
        const rewritten = rewritePath("/" + trimmedHref, mode, previewBasePath);
        return `<a ${before}href="${rewritten}"${after}>`;
      }

      // External link -> add target="_blank"
      if (!before.includes("target=") && !after.includes("target=")) {
        return `<a ${before}href="${trimmedHref}" target="_blank" rel="noopener noreferrer"${after}>`;
      }
      return match;
    }
  );
}

function rewritePath(pathname: string, mode: "dev" | "subdomain", previewBasePath: string): string {
  if (mode === "subdomain") {
    return pathname; // keep as-is, subdomain already scopes it
  }
  // Dev mode: prepend preview base path
  const normalizedPath = pathname.startsWith("/") ? pathname : "/" + pathname;
  return previewBasePath + normalizedPath;
}

/**
 * Inject a <base> tag pointing to the original domain so relative asset URLs resolve.
 * Only injects if no <base> tag is already present.
 */
export function injectBase(html: string, domain: string): string {
  if (/<base\s/i.test(html)) {
    return html;
  }
  const protocol = "https";
  const baseTag = `<base href="${protocol}://${domain}/" />`;
  // Insert after <head> or at start of <html>
  if (/<head(\s[^>]*)?>/.test(html)) {
    return html.replace(/(<head(?:\s[^>]*)?>)/i, `$1\n${baseTag}`);
  }
  return baseTag + "\n" + html;
}

/**
 * Neutralize <form> elements: disable submission and add a preview overlay.
 */
export function neutralizeForms(html: string): string {
  return html.replace(
    /<form\s([^>]*?)>/gi,
    (match, attrs: string) => {
      // Add onsubmit handler to prevent submission
      if (attrs.includes("onsubmit")) {
        return match;
      }
      return `<form ${attrs} onsubmit="event.preventDefault();alert('Form submission is disabled in preview mode.');return false;">`;
    }
  );
}

/**
 * Remove or neutralize <script> tags containing checkout/cart/payment logic
 * or window.location assignments to checkout paths.
 */
export function neutralizeCheckoutScripts(html: string): string {
  return html.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    (match, content: string) => {
      const dangerousPatterns = [
        /checkout/i,
        /cart.*submit/i,
        /payment/i,
        /window\.location\s*(?:\.\s*href\s*)?=\s*['"][^'"]*checkout/i,
        /stripe/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          return `<!-- [ZapSight Preview] checkout/payment script removed -->`;
        }
      }
      return match;
    }
  );
}

/**
 * Inject a fixed-position preview banner at the top of <body>.
 */
export function injectBanner(html: string, jobId: string, storeName: string): string {
  const banner = `
<div id="zapsight-preview-banner" style="position:fixed;top:0;left:0;right:0;z-index:999999;background:#1a1a2e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
  <span>This is a <strong>ZapSight</strong> preview &mdash; <em>${escapeHtml(storeName)}</em> with AI Shopping enabled</span>
  <button onclick="document.getElementById('zapsight-preview-banner').style.display='none';document.body.style.paddingTop='0';" style="background:none;border:1px solid rgba(255,255,255,0.3);color:#fff;padding:2px 10px;border-radius:4px;cursor:pointer;font-size:12px;">Close</button>
</div>
<style>#zapsight-preview-banner ~ * { } body { padding-top: 37px !important; }</style>`;

  if (/<body(\s[^>]*)?>/.test(html)) {
    return html.replace(/(<body(?:\s[^>]*)?>)/i, `$1\n${banner}`);
  }
  return banner + "\n" + html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
