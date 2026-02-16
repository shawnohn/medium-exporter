import TurndownService from 'turndown';
import type { ExportOptions } from './types';

function extractPreText(html: string, spanAsLine = false): string {
  let h = html;
  h = h.replace(/<br\s*\/?>/gi, '\n');
  h = h.replace(/<\/div>/gi, '\n');
  h = h.replace(/<\/p>/gi, '\n');
  if (spanAsLine) {
    h = h.replace(/<\/span>/gi, '\n');
  }
  h = h.replace(/<[^>]+>/g, '');
  h = h
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return h;
}

function createTurndownService(options: ExportOptions): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    hr: '---',
  });

  td.addRule('fencedCodeBlock', {
    filter(node) {
      return node.nodeName === 'PRE';
    },
    replacement(_content, node) {
      const el = node as HTMLElement;
      const codeEl = el.querySelector('code');
      const source = codeEl || el;
      const langClass = source.className.match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : '';

      // Extract text from innerHTML, converting block-level elements to newlines
      let text = extractPreText(source.innerHTML);

      // If no newlines after stripping (Medium line-container spans with no
      // whitespace between them), retry with </span> → \n
      if (!text.includes('\n') && source.querySelector('span')) {
        text = extractPreText(source.innerHTML, true);
      }

      // Use enough backticks to avoid conflict with content containing ```
      let fence = '```';
      const backtickMatch = text.match(/`{3,}/g);
      if (backtickMatch) {
        const maxLen = Math.max(...backtickMatch.map((m) => m.length));
        fence = '`'.repeat(maxLen + 1);
      }

      return `\n\n${fence}${lang}\n${text.trimEnd()}\n${fence}\n\n`;
    },
  });

  td.addRule('figureWithCaption', {
    filter: 'figure',
    replacement(_content, node) {
      const el = node as HTMLElement;
      const figcaption = el.querySelector('figcaption');
      const caption = figcaption?.textContent?.trim() || '';

      // Find image src: try <img>, then <picture><source>, then data-src
      let src = '';
      let alt = '';
      const img = el.querySelector('img');
      if (img) {
        alt = img.getAttribute('alt') || '';
        src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        // If src is a placeholder blob, try srcset
        if (!src || src.startsWith('data:')) {
          const srcset = img.getAttribute('srcset') || '';
          if (srcset) {
            src = srcset.split(',').pop()!.trim().split(/\s+/)[0];
          }
        }
      }
      // Fallback: <picture><source srcset>
      if (!src) {
        const source = el.querySelector('picture source[srcset]');
        if (source) {
          const srcset = source.getAttribute('srcset') || '';
          src = srcset.split(',').pop()!.trim().split(/\s+/)[0];
        }
      }

      if (!src) return caption ? `\n\n*${caption}*\n\n` : '';

      if (!options.includeImages) {
        return caption ? `\n\n*${caption}*\n\n` : '';
      }

      let md = `\n\n![${alt}](${src})`;
      if (caption) {
        md += `\n*${caption}*`;
      }
      return md + '\n\n';
    },
  });

  if (!options.includeImages) {
    td.addRule('removeImages', {
      filter: 'img',
      replacement() {
        return '';
      },
    });
  }

  return td;
}

export function htmlToMarkdown(html: string, options: ExportOptions): string {
  const td = createTurndownService(options);
  let markdown = td.turndown(html);

  // Collapse 3+ consecutive newlines to 2
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Trim trailing whitespace from each line
  markdown = markdown
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Trim leading/trailing whitespace, ensure single trailing newline
  markdown = markdown.trim() + '\n';

  return markdown;
}
