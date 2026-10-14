import { isHtmlBlock, sanitizeArticleHtml } from '../../../lib/articleContent';

/** TipTap HTML -> the array-of-blocks format stored in the database (each block sanitized). */
export function htmlToContentArray(html: string): string[] {
  if (!html || html === '<p></p>') return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const results: string[] = [];
  div.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim();
      if (t) results.push(sanitizeArticleHtml(`<p>${t}</p>`));
      return;
    }
    const el = node as HTMLElement;
    if (!el.outerHTML) return;
    const hasMedia =
      !!el.querySelector?.('img') ||
      el.tagName?.toLowerCase() === 'img' ||
      el.tagName?.toLowerCase() === 'hr';
    if (!el.textContent?.trim() && !hasMedia) return;
    results.push(sanitizeArticleHtml(el.outerHTML));
  });
  return results;
}

/** Stored blocks -> HTML for the editor. Old rows may hold '# title' / '> quote' plain-text blocks. */
export function contentArrayToHtml(content: string[] | undefined): string {
  if (!content || content.length === 0) return '';
  return content
    .map(line => {
      if (isHtmlBlock(line)) return line;
      if (line.startsWith('# ')) return `<h2>${line.slice(2)}</h2>`;
      if (line.startsWith('> ')) return `<blockquote>${line.slice(2)}</blockquote>`;
      return `<p>${line}</p>`;
    })
    .join('');
}
