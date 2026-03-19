const BLOCKED_DOMAINS = [
  "zapsight.com",
  "zapsight.us",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
];

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

  // Block our own domains and localhost
  if (BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) {
    return null;
  }

  // Block bare IPs
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return null;

  // Must have a real TLD (at least one dot)
  if (!domain.includes(".")) return null;

  return { url: `https://${domain}${parsed.pathname}`, domain };
}
