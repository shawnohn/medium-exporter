import { htmlToMarkdown } from '../shared/converter';
import { buildFrontmatter } from '../shared/frontmatter';
import type { ArticleMetadata } from '../shared/types';
import type { PopupMessage, BackgroundResponse } from '../shared/messages';

// DOM references
const titleEl = document.getElementById('article-title')!;
const urlEl = document.getElementById('article-url')!;
const frontmatterToggle = document.getElementById(
  'toggle-frontmatter'
) as HTMLInputElement;
const imagesToggle = document.getElementById(
  'toggle-images'
) as HTMLInputElement;
const copyBtn = document.getElementById('btn-copy') as HTMLButtonElement;
const downloadBtn = document.getElementById('btn-download') as HTMLButtonElement;
const statusEl = document.getElementById('status-message')!;

// State
let currentMarkdown = '';
let currentFilename = '';
let currentMetadata: ArticleMetadata | null = null;
let currentArticleHtml = '';

// Initialization
async function init(): Promise<void> {
  setStatus('Extracting article...', 'info');

  const response = await sendMessage({ type: 'EXTRACT' });

  if (response.type === 'ERROR') {
    setStatus(response.error, 'error');
    return;
  }

  if (response.type === 'EXTRACT_SUCCESS') {
    currentMetadata = response.metadata;
    currentArticleHtml = response.articleHtml;

    titleEl.textContent = currentMetadata.title || 'Untitled';
    urlEl.textContent = currentMetadata.canonicalUrl || '';
    urlEl.title = currentMetadata.canonicalUrl || '';

    buildMarkdown();
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    setStatus('Ready.', 'success');
  }
}

function buildMarkdown(): void {
  if (!currentMetadata || !currentArticleHtml) return;

  const options = {
    includeFrontmatter: frontmatterToggle.checked,
    includeImages: imagesToggle.checked,
  };

  const body = htmlToMarkdown(currentArticleHtml, options);

  let md = '';
  if (options.includeFrontmatter) {
    md += buildFrontmatter(currentMetadata) + '\n\n';
  }
  md += `# ${currentMetadata.title}\n\n`;
  md += body;

  currentMarkdown = md;
  currentFilename = generateFilename(currentMetadata);
}

function generateFilename(meta: ArticleMetadata): string {
  const date = meta.publishedDate || meta.retrievedDate;
  const dateStr = date.slice(0, 10);
  const slug = meta.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${dateStr} - ${slug}.md`;
}

// Event handlers
frontmatterToggle.addEventListener('change', () => buildMarkdown());
imagesToggle.addEventListener('change', () => buildMarkdown());

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    setStatus('Copied to clipboard!', 'success');
  } catch {
    setStatus('Clipboard write failed.', 'error');
  }
});

downloadBtn.addEventListener('click', async () => {
  setStatus('Starting download...', 'info');
  const response = await sendMessage({
    type: 'DOWNLOAD_FILE',
    markdown: currentMarkdown,
    filename: currentFilename,
  });

  if (response.type === 'DOWNLOAD_SUCCESS') {
    setStatus('Download started.', 'success');
  } else if (response.type === 'ERROR') {
    setStatus(response.error, 'error');
  }
});

// Helpers
function sendMessage(msg: PopupMessage): Promise<BackgroundResponse> {
  return chrome.runtime.sendMessage(msg);
}

function setStatus(
  text: string,
  level: 'info' | 'success' | 'error'
): void {
  statusEl.textContent = text;
  statusEl.className = level;
}

// Start
init();
