import TurndownService from 'turndown';
import type { ExportOptions } from './types';

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

      // Convert <br> and block-level wrappers to newlines before extracting text
      let html = source.innerHTML;
      html = html.replace(/<br\s*\/?>/gi, '\n');
      html = html.replace(/<\/div>/gi, '\n');
      html = html.replace(/<\/p>/gi, '\n');
      html = html.replace(/<[^>]+>/g, '');
      html = html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

      return `\n\n\`\`\`${lang}\n${html.trimEnd()}\n\`\`\`\n\n`;
    },
  });

  td.addRule('figureWithCaption', {
    filter: 'figure',
    replacement(_content, node) {
      const el = node as HTMLElement;
      const img = el.querySelector('img');
      const figcaption = el.querySelector('figcaption');

      if (!img) return '';

      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const caption = figcaption?.textContent?.trim() || '';

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

  // Ensure single trailing newline
  markdown = markdown.trimEnd() + '\n';

  return markdown;
}
