// Pure text helpers for article blocks. They live apart from lib/articleContent.ts on purpose: that file
// imports sanitize-html (plus htmlparser2 and postcss), which only the save path needs. Public pages import
// from here so reading an article never loads the sanitizer.

export function isHtmlBlock(block: string): boolean {
  return typeof block === 'string' && block.trimStart().startsWith('<');
}

export function blockToText(block: string): string {
  if (!isHtmlBlock(block)) return block.replace(/^(#|>)\s/, '');
  return block
    .replace(/<\/(p|h[1-3]|li|blockquote|pre)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function contentToText(content?: string[] | null): string {
  return (content || []).map(blockToText).join(' ');
}
