// Accept public-looking hostnames only. Never send the referrer URL or its search parameters.
export const referrerDomainPattern = /^(?=.{1,180}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function searchEngine(domain: string) {
  if (/^(?:www\.)?google\.(?:com|cat|[a-z]{2}|(?:co|com)\.[a-z]{2})$/.test(domain)) return "Google";
  if (domain === "bing.com" || domain.endsWith(".bing.com")) return "Bing";
  const engines = [
    ["duckduckgo.com", "DuckDuckGo"], ["search.yahoo.com", "Yahoo"], ["ecosia.org", "Ecosia"],
    ["search.brave.com", "Brave Search"], ["yandex.com", "Yandex"], ["baidu.com", "Baidu"],
  ] as const;
  const known = engines.find(([host]) => domain === host || domain.endsWith("." + host));
  return known?.[1];
}

export function referringDomain(referrer: string, currentHost: string) {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    const domain = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    const ownDomain = currentHost.toLowerCase().replace(/^www\./, "");
    if (domain === ownDomain || !referrerDomainPattern.test(domain)) return undefined;
    return domain;
  } catch {
    return undefined;
  }
}
