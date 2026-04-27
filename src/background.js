import { DEFAULT_SETTINGS } from './shared/defaults.js';
import { getNotebookStats, setNotebookFavorite, upsertNotebookEntry } from './shared/notebook.js';
import { getProviderConfig, getSettings } from './shared/storage.js';
import { translateWithProvider } from './shared/translation-service.js';

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
  const settings = await getSettings();
  const providerConfig = await getProviderConfig();

  return translateWithProvider({
    text,
    targetLanguage,
    sourceLanguage,
    provider: settings.translationProvider,
    providerConfig
  });
}

function openPdfViewer(fileUrl) {
  const target = chrome.runtime.getURL(`viewer.html?file=${encodeURIComponent(fileUrl)}`);
  chrome.tabs.create({ url: target });
}
