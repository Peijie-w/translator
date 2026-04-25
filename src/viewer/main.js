import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

import { getSettings } from '../shared/storage.js';
import { requestTranslation } from '../shared/translator-client.js';
import { extractWordAtPoint, normalizeHoverWord } from '../shared/word.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MAX_SELECTION_LENGTH = 1500;

let settings = await getSettings();
let hoverTimer = null;
let requestToken = 0;
let activeWord = '';
let selectedText = '';
let currentEntry = null;

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') {
    return;
  }

  settings = {
    ...settings,
    ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
  };
});

document.body.style.margin = '0';
document.body.style.fontFamily = '"Avenir Next", "PingFang SC", sans-serif';
document.body.style.background = '#0f151d';
document.querySelector('#app').innerHTML = `
  <main style="min-height:100vh;color:#eef4ff;background:
    radial-gradient(circle at top right, rgba(255, 166, 76, 0.18), transparent 24%),
    linear-gradient(180deg, #121a23 0%, #0e141d 100%);">
    <header style="position:sticky;top:0;z-index:10;display:grid;gap:12px;padding:18px 20px;background:rgba(11,16,24,0.86);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;">
        <div>
          <div style="font-size:24px;font-weight:800;">Ubersetzer PDF Viewer</div>
          <div style="font-size:13px;color:#afbdd3;margin-top:5px;">Open a PDF here, then hover over text to translate it.</div>
        </div>
        <div id="status" style="font-size:13px;color:#ffdc93;">No document loaded</div>
      </div>
      <div style="display:grid;grid-template-columns:minmax(0, 1fr) auto auto auto;gap:10px;align-items:center;">
        <input id="pdf-url" type="url" placeholder="Paste a PDF URL" style="${toolbarInputStyle()}" />
        <input id="pdf-file" type="file" accept="application/pdf" style="${toolbarInputStyle()}" />
        <button id="open-url" style="${toolbarButtonStyle(true)}">Open URL</button>
        <button id="rerender" style="${toolbarButtonStyle(false)}">Refresh</button>
      </div>
    </header>
    <section id="viewer" style="padding:24px;display:grid;gap:26px;justify-content:center;"></section>
  </main>
`;

injectViewerStyles();

const statusEl = document.querySelector('#status');
const viewerEl = document.querySelector('#viewer');
const pdfUrlInput = document.querySelector('#pdf-url');
const pdfFileInput = document.querySelector('#pdf-file');

document.querySelector('#open-url').addEventListener('click', () => {
  const url = pdfUrlInput.value.trim();
  if (url) {
    void loadPdfFromUrl(url);
  }
});

document.querySelector('#rerender').addEventListener('click', () => {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('file') || pdfUrlInput.value.trim();
  if (url) {
    void loadPdfFromUrl(url);
  }
});

pdfFileInput.addEventListener('change', async () => {
  const [file] = pdfFileInput.files ?? [];
  if (!file) {
    return;
  }
  await loadPdfFromFile(file);
});

viewerEl.addEventListener('mousemove', handleViewerHover, true);
viewerEl.addEventListener('mouseup', handleViewerSelectionMouseUp, true);
viewerEl.addEventListener('scroll', () => hideTooltip(), true);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideTooltip();
  }
});

const initialUrl = new URLSearchParams(window.location.search).get('file');
if (initialUrl) {
  pdfUrlInput.value = initialUrl;
  void loadPdfFromUrl(initialUrl);
}

async function loadPdfFromUrl(url) {
  statusEl.textContent = 'Loading PDF from URL...';
  viewerEl.replaceChildren();
  updateQuery(url);

  try {
    const documentTask = pdfjsLib.getDocument({
      url,
      withCredentials: false,
      useWorkerFetch: true
    });
    const pdf = await documentTask.promise;
    await renderPdfDocument(pdf);
    statusEl.textContent = `Loaded ${pdf.numPages} page(s)`;
  } catch (error) {
    statusEl.textContent = 'Could not load PDF from that URL';
    viewerEl.innerHTML = renderError(error);
    console.error('[Ubersetzer] PDF load failed:', error);
  }
}

async function loadPdfFromFile(file) {
  statusEl.textContent = `Loading ${file.name}...`;
  viewerEl.replaceChildren();

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    await renderPdfDocument(pdf);
    statusEl.textContent = `Loaded ${file.name} (${pdf.numPages} page(s))`;
  } catch (error) {
    statusEl.textContent = 'Could not load local PDF';
    viewerEl.innerHTML = renderError(error);
    console.error('[Ubersetzer] Local PDF load failed:', error);
  }
}

async function renderPdfDocument(pdf) {
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: settings.pdfScale });
    const pageContainer = document.createElement('article');
    pageContainer.className = 'pdf-page';
    pageContainer.style.width = `${viewport.width}px`;

    const pageLabel = document.createElement('div');
    pageLabel.className = 'page-label';
    pageLabel.textContent = `Page ${pageNumber}`;

    const renderSurface = document.createElement('div');
    renderSurface.className = 'page-surface';
    renderSurface.style.width = `${viewport.width}px`;
    renderSurface.style.height = `${viewport.height}px`;

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const textLayer = document.createElement('div');
    textLayer.className = 'text-layer';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    renderSurface.append(canvas, textLayer);
    pageContainer.append(pageLabel, renderSurface);
    viewerEl.append(pageContainer);

    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport
    }).promise;

    const textContent = await page.getTextContent();
    const textLayerRenderer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayer,
      viewport
    });
    await textLayerRenderer.render();
  }
}

async function handleViewerHover(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest('.viewer-tooltip')) {
    return;
  }

  if (getSelectedText(document)) {
    return;
  }

  selectedText = '';
  const word = normalizeHoverWord(extractWordAtPoint(document, event.clientX, event.clientY));
  if (!word || word.length < 2) {
    activeWord = '';
    window.clearTimeout(hoverTimer);
    hideTooltip();
    return;
  }

  if (word === activeWord && tooltipRoot.dataset.hidden !== 'true') {
    positionTooltip(event.clientX, event.clientY);
    return;
  }

  activeWord = word;
  window.clearTimeout(hoverTimer);
  hoverTimer = window.setTimeout(() => {
    void translateWord(word, event.clientX, event.clientY);
  }, settings.hoverDelayMs);
}

function handleViewerSelectionMouseUp(event) {
  if (!(event.target instanceof Element) || event.target.closest('.viewer-tooltip')) {
    return;
  }

  window.setTimeout(() => {
    const text = normalizeSelectedText(getSelectedText(document));
    if (!text || text.length < 2 || text === selectedText) {
      return;
    }

    selectedText = text;
    activeWord = '';
    window.clearTimeout(hoverTimer);
    void translateSelectedText(text, event.clientX, event.clientY);
  }, 40);
}

async function translateWord(word, x, y) {
  const token = ++requestToken;
  showTooltip({ word, translation: 'Loading...', source: 'Translating' }, x, y);

  try {
    const result = await requestTranslation({
      text: word,
      targetLanguage: settings.targetLanguage,
      sourceLanguage: settings.sourceLanguage
    });

    if (token !== requestToken || activeWord !== word) {
      return;
    }

    showTooltip(
      {
        word,
        translation: result.translatedText || '(no translation)',
        source: result.detectedSourceLanguage ? `Detected: ${result.detectedSourceLanguage}` : 'Translation',
        entry: await recordTranslation({
          sourceText: word,
          translatedText: result.translatedText || '(no translation)',
          sourceLanguage: result.detectedSourceLanguage,
          targetLanguage: settings.targetLanguage,
          contextType: 'hover'
        })
      },
      x,
      y
    );
  } catch (error) {
    if (token !== requestToken) {
      return;
    }

    showTooltip({ word, translation: 'Translation unavailable', source: 'Error' }, x, y);
    console.warn('[Ubersetzer] Viewer translation failed:', error);
  }
}

async function translateSelectedText(text, x, y) {
  const token = ++requestToken;
  showTooltip({ word: text, translation: 'Loading...', source: 'Translating selection' }, x, y);

  try {
    const result = await requestTranslation({
      text,
      targetLanguage: settings.targetLanguage,
      sourceLanguage: settings.sourceLanguage
    });

    if (token !== requestToken || selectedText !== text) {
      return;
    }

    showTooltip(
      {
        word: text,
        translation: result.translatedText || '(no translation)',
        source: 'Selected text',
        entry: await recordTranslation({
          sourceText: text,
          translatedText: result.translatedText || '(no translation)',
          sourceLanguage: result.detectedSourceLanguage,
          targetLanguage: settings.targetLanguage,
          contextType: 'selection'
        })
      },
      x,
      y
    );
  } catch (error) {
    if (token !== requestToken) {
      return;
    }

    showTooltip({ word: text, translation: 'Translation unavailable', source: 'Selected text' }, x, y);
    console.warn('[Ubersetzer] Viewer selection translation failed:', error);
  }
}

const tooltipRoot = document.createElement('div');
tooltipRoot.dataset.hidden = 'true';
tooltipRoot.className = 'viewer-tooltip';
tooltipRoot.innerHTML = `
  <div class="tip-source"></div>
  <div class="tip-word"></div>
  <div class="tip-translation"></div>
  <div class="tip-actions">
    <button class="tip-favorite" type="button">Save</button>
  </div>
`;
document.body.append(tooltipRoot);

const favoriteButton = tooltipRoot.querySelector('.tip-favorite');

favoriteButton.addEventListener('click', async (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (!currentEntry?.id) {
    return;
  }

  favoriteButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'toggle-notebook-favorite',
      payload: { id: currentEntry.id }
    });

    if (response?.ok && response.entry) {
      currentEntry = response.entry;
      updateFavoriteButton();
    }
  } catch (error) {
    console.warn('[Ubersetzer] Viewer favorite toggle failed:', error);
  } finally {
    favoriteButton.disabled = false;
  }
});

function showTooltip({ word, translation, source, entry }, x, y) {
  currentEntry = entry ?? null;
  updateFavoriteButton();
  tooltipRoot.querySelector('.tip-source').textContent = source;
  tooltipRoot.querySelector('.tip-word').textContent = word;
  tooltipRoot.querySelector('.tip-translation').textContent = translation;
  tooltipRoot.dataset.hidden = 'false';
  positionTooltip(x, y);
}

function positionTooltip(x, y) {
  const padding = 18;
  const left = Math.min(x + 16, window.innerWidth - tooltipRoot.offsetWidth - padding);
  const top = Math.min(y + 20, window.innerHeight - tooltipRoot.offsetHeight - padding);
  tooltipRoot.style.left = `${Math.max(left, padding)}px`;
  tooltipRoot.style.top = `${Math.max(top, padding)}px`;
}

function hideTooltip() {
  tooltipRoot.dataset.hidden = 'true';
}

function updateFavoriteButton() {
  const isFavorite = Boolean(currentEntry?.favorite);
  favoriteButton.textContent = isFavorite ? 'Saved' : 'Save';
  favoriteButton.dataset.favorite = String(isFavorite);
  favoriteButton.disabled = !currentEntry?.id;
}

function getSelectedText(documentRef) {
  const selection = documentRef.getSelection?.();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return '';
  }

  return selection.toString();
}

function normalizeSelectedText(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_SELECTION_LENGTH);
}

async function recordTranslation(payload) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'record-translation',
      payload: {
        ...payload,
        pageTitle: document.title,
        pageUrl: new URLSearchParams(window.location.search).get('file') || window.location.href
      }
    });

    return response?.ok ? response.entry ?? null : null;
  } catch (error) {
    console.warn('[Ubersetzer] Viewer notebook update failed:', error);
    return null;
  }
}

function updateQuery(url) {
  const next = new URL(window.location.href);
  next.searchParams.set('file', url);
  history.replaceState({}, '', next);
}

function renderError(error) {
  return `
    <section style="max-width:760px;padding:24px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
      <div style="font-size:18px;font-weight:700;margin-bottom:8px;">PDF load failed</div>
      <div style="font-size:14px;line-height:1.6;color:#cfd7e7;">${String(error?.message ?? error)}</div>
      <div style="font-size:14px;line-height:1.6;color:#9fb0ca;margin-top:10px;">
        Try another PDF URL, or use the file picker for a local document. Some websites block cross-origin PDF requests.
      </div>
    </section>
  `;
}

function toolbarInputStyle() {
  return `
    width:100%;
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.08);
    color:#eef4ff;
    box-sizing:border-box;
  `;
}

function toolbarButtonStyle(primary) {
  if (primary) {
    return `
      padding:11px 14px;
      border:none;
      border-radius:14px;
      background:linear-gradient(135deg, #ffd37f, #ff9b52);
      color:#221104;
      font-weight:800;
      cursor:pointer;
    `;
  }

  return `
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.06);
    color:#eef4ff;
    font-weight:700;
    cursor:pointer;
  `;
}

function injectViewerStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .pdf-page {
      display: grid;
      gap: 10px;
    }

    .page-label {
      font-size: 12px;
      color: #a8b6ca;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .page-surface {
      position: relative;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 26px 60px rgba(0, 0, 0, 0.28);
    }

    .text-layer {
      position: absolute;
      inset: 0;
      overflow: hidden;
      opacity: 0.01;
      line-height: 1;
      transform-origin: 0 0;
    }

    .text-layer span,
    .text-layer br {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }

    .text-layer ::selection {
      background: rgba(86, 172, 255, 0.28);
    }

    .viewer-tooltip {
      position: fixed;
      z-index: 50;
      max-width: 280px;
      padding: 12px 13px;
      border-radius: 16px;
      background: rgba(15, 20, 31, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
      pointer-events: auto;
    }

    .viewer-tooltip[data-hidden="true"] {
      display: none;
    }

    .viewer-tooltip .tip-source {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #96a8bf;
      margin-bottom: 5px;
    }

    .viewer-tooltip .tip-word {
      font-size: 15px;
      font-weight: 700;
      color: white;
      margin-bottom: 7px;
      max-height: 4.2em;
      overflow: hidden;
      word-break: break-word;
    }

    .viewer-tooltip .tip-translation {
      font-size: 16px;
      color: #beffd8;
      max-height: 8.4em;
      overflow: auto;
      word-break: break-word;
    }

    .viewer-tooltip .tip-actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }

    .viewer-tooltip .tip-favorite {
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 215, 90, 0.12);
      color: #ffdd85;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .viewer-tooltip .tip-favorite[data-favorite="true"] {
      background: rgba(107, 241, 167, 0.18);
      color: #b6ffd3;
    }

    .viewer-tooltip .tip-favorite:disabled {
      opacity: 0.55;
      cursor: default;
    }
  `;
  document.head.append(style);
}
