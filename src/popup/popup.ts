import { htmlToMarkdown } from '../shared/converter';
import { buildFrontmatter } from '../shared/frontmatter';
import type { ArticleMetadata, ObsidianSettings } from '../shared/types';
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
const obsidianBtn = document.getElementById('btn-obsidian') as HTMLButtonElement;
const statusEl = document.getElementById('status-message')!;
const versionEl = document.getElementById('version')!;

// Obsidian settings DOM
const toggleSettingsBtn = document.getElementById(
  'btn-toggle-settings'
) as HTMLButtonElement;
const settingsPanel = document.getElementById('settings-panel')!;
const apiUrlInput = document.getElementById('setting-api-url') as HTMLInputElement;
const apiKeyInput = document.getElementById('setting-api-key') as HTMLInputElement;
const folderInput = document.getElementById('setting-folder') as HTMLInputElement;
const saveSettingsBtn = document.getElementById(
  'btn-save-settings'
) as HTMLButtonElement;
const testConnectionBtn = document.getElementById(
  'btn-test-connection'
) as HTMLButtonElement;

// Display version from manifest
versionEl.textContent = `v${chrome.runtime.getManifest().version}`;

// State
let currentMarkdown = '';
let currentFilename = '';
let currentMetadata: ArticleMetadata | null = null;
let currentArticleHtml = '';
let obsidianSettings: ObsidianSettings | null = null;

// Initialization
async function init(): Promise<void> {
  setStatus('Extracting article...', 'info');

  await loadSettings();

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
    obsidianBtn.disabled = false;
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
    md += buildFrontmatter(currentMetadata) + '\n';
  }
  md += `# ${currentMetadata.title}\n\n`;
  md += body;

  // Remove any leading blank lines from the final output
  currentMarkdown = md.replace(/^\n+/, '');
  currentFilename = generateFilename(currentMetadata);
}

function generateFilename(meta: ArticleMetadata): string {
  const title = meta.title
    .replace(/[<>:"/\\|?*]/g, '')
    .trim();
  return `${title || 'Untitled'}.md`;
}

// Obsidian settings

async function loadSettings(): Promise<void> {
  const result = await chrome.storage.local.get('obsidianSettings');
  if (result.obsidianSettings) {
    obsidianSettings = result.obsidianSettings as ObsidianSettings;
    apiUrlInput.value = obsidianSettings.apiUrl;
    apiKeyInput.value = obsidianSettings.apiKey;
    folderInput.value = obsidianSettings.folderPath;
  }
}

async function saveSettings(): Promise<void> {
  let folderPath = folderInput.value.trim();
  if (folderPath && !folderPath.endsWith('/')) {
    folderPath += '/';
  }

  obsidianSettings = {
    apiUrl: apiUrlInput.value.trim() || 'http://127.0.0.1:27123',
    apiKey: apiKeyInput.value.trim(),
    folderPath,
  };

  await chrome.storage.local.set({ obsidianSettings });
  setStatus('Obsidian settings saved.', 'success');
}

async function ensureHostPermission(apiUrl: string): Promise<boolean> {
  const origin = new URL(apiUrl).origin + '/*';
  const hasPermission = await chrome.permissions.contains({
    origins: [origin],
  });
  if (hasPermission) return true;

  return chrome.permissions.request({ origins: [origin] });
}

async function testConnection(): Promise<void> {
  if (!obsidianSettings?.apiKey) {
    setStatus('Enter an API key and save first.', 'error');
    return;
  }

  const apiUrl = obsidianSettings.apiUrl || 'http://127.0.0.1:27123';

  const granted = await ensureHostPermission(apiUrl);
  if (!granted) {
    setStatus('Permission denied for Obsidian API URL.', 'error');
    return;
  }

  setStatus('Testing connection...', 'info');

  try {
    const response = await fetch(new URL('/', apiUrl).href, {
      method: 'GET',
      headers: { Authorization: `Bearer ${obsidianSettings.apiKey}` },
      mode: 'cors',
    });

    if (!response.ok) {
      setStatus(`Connection failed (${response.status}).`, 'error');
      return;
    }

    const data = await response.json();
    if (data.authenticated) {
      setStatus('Connection successful!', 'success');
    } else {
      setStatus('Connected but not authenticated. Check API key.', 'error');
    }
  } catch {
    setStatus(
      'Could not connect. Is Obsidian running with Local REST API enabled?',
      'error'
    );
  }
}

// Event handlers
frontmatterToggle.addEventListener('change', () => buildMarkdown());
imagesToggle.addEventListener('change', () => buildMarkdown());

toggleSettingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

saveSettingsBtn.addEventListener('click', () => saveSettings());
testConnectionBtn.addEventListener('click', () => testConnection());

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

obsidianBtn.addEventListener('click', async () => {
  if (!obsidianSettings?.apiKey) {
    setStatus('Configure Obsidian settings first.', 'error');
    settingsPanel.classList.remove('hidden');
    return;
  }

  const apiUrl = obsidianSettings.apiUrl || 'http://127.0.0.1:27123';

  const granted = await ensureHostPermission(apiUrl);
  if (!granted) {
    setStatus('Permission denied for Obsidian API URL.', 'error');
    return;
  }

  setStatus('Sending to Obsidian...', 'info');

  const filename = obsidianSettings.folderPath
    ? obsidianSettings.folderPath + currentFilename
    : currentFilename;

  const response = await sendMessage({
    type: 'SEND_TO_OBSIDIAN',
    markdown: currentMarkdown,
    filename,
    settings: { ...obsidianSettings, apiUrl },
  });

  if (response.type === 'OBSIDIAN_SUCCESS') {
    setStatus('Sent to Obsidian!', 'success');
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
