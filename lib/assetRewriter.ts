import { JSDOM } from "jsdom";

export function isAbsoluteUrl(u: string) {
  return /^(https?:)?\/\//i.test(u) || /^(data:|blob:|mailto:|tel:)/i.test(u);
}

export function joinUrl(base: string, rel: string) {
  try {
    return new URL(rel, base).toString();
  } catch {
    if (base.endsWith("/") && rel.startsWith("/")) return base + rel.slice(1);
    if (!base.endsWith("/") && !rel.startsWith("/")) return `${base}/${rel}`;
    return base + rel;
  }
}

export function rewriteHtmlAssets(html: string, baseUrl: string) {
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const rewriteAttr = (selector: string, attr: "src" | "href") => {
    document.querySelectorAll(selector).forEach((el) => {
      const v = el.getAttribute(attr);
      if (!v || isAbsoluteUrl(v) || v.startsWith("#")) return;
      el.setAttribute(attr, joinUrl(baseUrl, v));
    });
  };

  rewriteAttr("img[src]", "src");
  rewriteAttr("script[src]", "src");
  rewriteAttr("link[href]", "href");

  document.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const style = el.getAttribute("style");
    if (!style) return;
    el.setAttribute("style", rewriteCssUrls(style, baseUrl));
  });

  document.querySelectorAll("style").forEach((styleEl) => {
    const css = styleEl.textContent || "";
    styleEl.textContent = rewriteCssUrls(css, baseUrl);
  });

  return dom.serialize();
}

export function rewriteCssUrls(css: string, baseUrl: string) {
  return css.replace(
    /url\(\s*(?:'([^']+)'|"([^"]+)"|([^'")]+))\s*\)/gi,
    (_m, s1, s2, s3) => {
      const raw = s1 || s2 || s3 || "";
      const trimmed = raw.trim();
      if (!trimmed || isAbsoluteUrl(trimmed) || trimmed.startsWith("#")) {
        return `url(${raw})`;
      }
      return `url(${joinUrl(baseUrl, trimmed)})`;
    }
  );
}
