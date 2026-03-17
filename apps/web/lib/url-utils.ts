export function normalizeUrl(
  input: string
): { url: string; domain: string } | null {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (!parsed.hostname) return null;

  const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");

  return { url: `https://${domain}${parsed.pathname}`, domain };
}
