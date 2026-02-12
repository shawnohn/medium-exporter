import type { ExtractResult } from '../shared/types';

/**
 * Self-contained extraction function injected into Medium pages
 * via chrome.scripting.executeScript({ func }).
 *
 * IMPORTANT: This function must not reference anything outside its body
 * at runtime. Type-only imports are fine (erased at compile time).
 */
export function extractArticle(): ExtractResult {
  // 1. Detect Medium page
  const article = document.querySelector('article');
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  const isMedium =
    article !== null ||
    (ogSiteName !== null && ogSiteName.getAttribute('content') === 'Medium');

  if (!isMedium || !article) {
    return {
      success: false as const,
      error: 'This does not appear to be a Medium article page.',
    };
  }

  // 2. Extract metadata
  const metadata = {
    title: '',
    author: '',
    canonicalUrl: '',
    publishedDate: '',
    retrievedDate: new Date().toISOString().slice(0, 10),
  };

  // 2a. JSON-LD
  const ldScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  for (const script of ldScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const obj = Array.isArray(data) ? data[0] : data;
      if (
        obj['@type'] === 'Article' ||
        obj['@type'] === 'NewsArticle' ||
        obj['@type'] === 'BlogPosting'
      ) {
        metadata.title = metadata.title || obj.headline || obj.name || '';
        metadata.author =
          metadata.author ||
          (typeof obj.author === 'string' ? obj.author : obj.author?.name) ||
          '';
        metadata.canonicalUrl = metadata.canonicalUrl || obj.url || '';
        metadata.publishedDate =
          metadata.publishedDate ||
          (obj.datePublished ? obj.datePublished.slice(0, 10) : '');
      }
    } catch {
      // ignore parse errors
    }
  }

  // 2b. Meta tag fallbacks
  const getMeta = (prop: string): string =>
    document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
    document.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') ||
    '';

  metadata.title = metadata.title || getMeta('og:title') || '';
  metadata.author =
    metadata.author || getMeta('author') || getMeta('article:author') || '';
  metadata.canonicalUrl = metadata.canonicalUrl || getMeta('og:url') || '';
  metadata.publishedDate =
    metadata.publishedDate ||
    (getMeta('article:published_time') || '').slice(0, 10);

  // 2c. DOM fallbacks
  metadata.title = metadata.title || document.title || '';
  metadata.canonicalUrl =
    metadata.canonicalUrl ||
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    window.location.href;

  // 3. Clean article HTML
  const clone = article.cloneNode(true) as HTMLElement;

  const removeSelectors = [
    'button',
    'svg',
    '[role="button"]',
    'aside',
    '[data-testid*="response"]',
    '[data-testid*="clap"]',
    '[aria-label*="clap"]',
    '[aria-label*="responses"]',
  ];

  for (const sel of removeSelectors) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Remove sign-up prompts and recommendations
  clone.querySelectorAll('div, section, p').forEach((el) => {
    const text = el.textContent?.trim() || '';
    if (
      text.length < 200 &&
      (/sign up/i.test(text) ||
        /subscribe/i.test(text) ||
        /get started/i.test(text) ||
        /open in app/i.test(text) ||
        /free trial/i.test(text) ||
        /more from/i.test(text) ||
        /recommended from/i.test(text))
    ) {
      el.remove();
    }
  });

  return {
    success: true as const,
    metadata,
    articleHtml: clone.innerHTML,
  };
}
