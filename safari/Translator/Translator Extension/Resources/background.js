const DEFAULT_SETTINGS = {
  targetLanguage: 'zh-CN',
  sourceLanguage: 'auto',
  hoverDelayMs: 700,
  pdfScale: 1.35
};

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
  if (message?.type !== 'translate-text') {
    return false;
  }

  translateText(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

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
