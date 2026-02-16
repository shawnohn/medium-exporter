import type { PopupMessage, BackgroundResponse } from '../shared/messages';
import type { ExtractResult, ObsidianSettings } from '../shared/types';
import { extractArticle } from '../content/extractor';

chrome.runtime.onMessage.addListener(
  (message: PopupMessage, _sender, sendResponse) => {
    if (message.type === 'EXTRACT') {
      handleExtract().then(sendResponse);
      return true; // async response
    }

    if (message.type === 'DOWNLOAD_FILE') {
      handleDownload(message.markdown, message.filename).then(sendResponse);
      return true;
    }

    if (message.type === 'SEND_TO_OBSIDIAN') {
      handleSendToObsidian(
        message.markdown,
        message.filename,
        message.settings
      ).then(sendResponse);
      return true;
    }
  }
);

async function handleExtract(): Promise<BackgroundResponse> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      return { type: 'ERROR', error: 'No active tab found.' };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractArticle,
    });

    const result = results[0]?.result as ExtractResult | undefined;

    if (!result) {
      return { type: 'ERROR', error: 'Extraction returned no result.' };
    }

    if (!result.success) {
      return { type: 'ERROR', error: result.error };
    }

    return {
      type: 'EXTRACT_SUCCESS',
      metadata: result.metadata,
      articleHtml: result.articleHtml,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { type: 'ERROR', error: `Injection failed: ${msg}` };
  }
}

async function handleSendToObsidian(
  markdown: string,
  filename: string,
  settings: ObsidianSettings
): Promise<BackgroundResponse> {
  try {
    const path = `/vault/${encodeVaultPath(filename)}`;
    const url = new URL(path, settings.apiUrl);

    const response = await fetch(url.href, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/markdown',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: markdown,
      mode: 'cors',
    });

    if (response.status === 204 || response.status === 200) {
      return { type: 'OBSIDIAN_SUCCESS' };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        type: 'ERROR',
        error: 'Authentication failed. Check your API key.',
      };
    }

    return {
      type: 'ERROR',
      error: `Obsidian API error (${response.status}): ${response.statusText}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return {
        type: 'ERROR',
        error:
          'Could not connect to Obsidian. Make sure Obsidian is running with the Local REST API plugin enabled.',
      };
    }
    return { type: 'ERROR', error: `Obsidian send failed: ${msg}` };
  }
}

function encodeVaultPath(filepath: string): string {
  return filepath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function handleDownload(
  markdown: string,
  filename: string
): Promise<BackgroundResponse> {
  try {
    const encoder = new TextEncoder();
    const uint8 = encoder.encode(markdown);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:text/markdown;charset=utf-8;base64,${base64}`;

    await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: true,
    });

    return { type: 'DOWNLOAD_SUCCESS' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { type: 'ERROR', error: `Download failed: ${msg}` };
  }
}
