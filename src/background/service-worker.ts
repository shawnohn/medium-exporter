import type { PopupMessage, BackgroundResponse } from '../shared/messages';
import type { ExtractResult } from '../shared/types';
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
