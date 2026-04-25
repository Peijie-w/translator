import { DEFAULT_SETTINGS } from './shared/defaults.js';
import { getNotebookStats, setNotebookFavorite, upsertNotebookEntry } from './shared/notebook.js';

const PDF_URL_PATTERN = /\.pdf(?:$|[?#])/i;

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...existing });
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: 'open-pdf-viewer-page',
    title: 'Open page PDF in Ubersetzer',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'open-pdf-viewer-link',
    title: 'Open linked PDF in Ubersetzer',
    contexts: ['link'],
    targetUrlPatterns: ['*://*/*.pdf', '*://*/*.PDF']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-pdf-viewer-link' && info.linkUrl) {
    openPdfViewer(info.linkUrl);
    return;
  }

  if (info.menuItemId === 'open-pdf-viewer-page' && tab?.url && PDF_URL_PATTERN.test(tab.url)) {
    openPdfViewer(tab.url);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void handleMessage(message, sendResponse);
  return true;
});

async function handleMessage(message, sendResponse) {
  try {
    switch (message?.type) {
      case 'translate-text': {
        const data = await translateText(message.payload);
        sendResponse({ ok: true, data });
        return;
      }
      case 'record-translation': {
        const entry = await upsertNotebookEntry(message.payload);
        sendResponse({ ok: true, entry });
        return;
      }
      case 'toggle-notebook-favorite': {
        const entry = await setNotebookFavorite(message.payload?.id, message.payload?.favorite);
        sendResponse({ ok: true, entry });
        return;
      }
      case 'get-notebook-stats': {
        const stats = await getNotebookStats();
        sendResponse({ ok: true, stats });
        return;
      }
      default:
        sendResponse({ ok: false, error: 'Unsupported message type.' });
    }
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }
}

async function translateText({ text, targetLanguage, sourceLanguage = 'auto' }) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    throw new Error('No text provided.');
  }

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', sourceLanguage);
  url.searchParams.set('tl', targetLanguage);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', trimmed);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translate request failed: ${response.status}`);
  }

  const body = await response.json();
  const translatedText = Array.isArray(body?.[0])
    ? body[0].map((item) => item?.[0] ?? '').join('')
    : '';

  return {
    translatedText: translatedText.trim(),
    detectedSourceLanguage: body?.[2] ?? sourceLanguage
  };
}

function openPdfViewer(fileUrl) {
  const target = chrome.runtime.getURL(`viewer.html?file=${encodeURIComponent(fileUrl)}`);
  chrome.tabs.create({ url: target });
}
