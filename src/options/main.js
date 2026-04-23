import { getSettings, saveSettings } from '../shared/storage.js';
import { LANGUAGE_OPTIONS } from '../shared/languages.js';
import { clearNotebookHistory, getNotebook, removeNotebookEntry, setNotebookFavorite } from '../shared/notebook.js';

const settings = await getSettings();
let notebook = await getNotebook();
let notebookFilter = 'all';
let notebookSearch = '';

document.body.style.margin = '0';
document.body.style.background = '#f4efe4';
document.body.style.fontFamily = '"Avenir Next", "PingFang SC", sans-serif';

document.querySelector('#app').innerHTML = `
  <main style="min-height:100vh;padding:32px;box-sizing:border-box;background:
    radial-gradient(circle at top left, rgba(255, 181, 84, 0.35), transparent 30%),
    radial-gradient(circle at bottom right, rgba(31, 137, 93, 0.18), transparent 26%),
    #f4efe4;">
    <section style="max-width:860px;margin:0 auto;background:rgba(255,255,255,0.78);backdrop-filter:blur(16px);padding:28px;border-radius:28px;border:1px solid rgba(19,31,38,0.08);box-shadow:0 28px 60px rgba(40,29,12,0.12);display:grid;gap:22px;">
      <header style="display:grid;gap:8px;">
        <div style="font-size:34px;font-weight:800;color:#1b1d16;">Ubersetzer Settings</div>
        <div style="font-size:15px;line-height:1.6;color:#44504f;max-width:60ch;">
          Configure the hover translation behavior for regular web pages and the built-in PDF viewer. This version works best with text-based PDFs, because browser-native PDF tabs do not allow extensions to inject hover UI reliably.
        </div>
      </header>

      <section style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:18px;">
        <label style="${fieldCardStyle()}">
          <span>Target language</span>
          <select id="target-language" style="${fieldControlStyle()}">
            ${LANGUAGE_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
          </select>
        </label>

        <label style="${fieldCardStyle()}">
          <span>Source language</span>
          <select id="source-language" style="${fieldControlStyle()}">
            <option value="auto">Auto detect</option>
            ${LANGUAGE_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
          </select>
        </label>

        <label style="${fieldCardStyle()}">
          <span>Hover delay</span>
          <input id="hover-delay" type="range" min="350" max="1800" step="50" value="${settings.hoverDelayMs}" />
          <strong id="hover-delay-label" style="font-size:14px;color:#314147;"></strong>
        </label>

        <label style="${fieldCardStyle()}">
          <span>PDF zoom</span>
          <input id="pdf-scale" type="range" min="0.9" max="2.2" step="0.05" value="${settings.pdfScale}" />
          <strong id="pdf-scale-label" style="font-size:14px;color:#314147;"></strong>
        </label>
      </section>

      <section style="display:grid;gap:10px;padding:18px 20px;border-radius:20px;background:#182129;color:#eef7ff;">
        <strong style="font-size:16px;">Usage notes</strong>
        <div style="font-size:14px;line-height:1.6;color:#d9e6f2;">
          On normal websites, just hover over a word and wait for the delay you selected.
          For PDFs, open them with the extension viewer from the popup or the right-click menu, then hover over text inside the rendered PDF page.
        </div>
      </section>

      <section style="display:grid;gap:16px;padding:22px;border-radius:24px;background:#f7f3ea;border:1px solid rgba(20,32,38,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div style="display:grid;gap:6px;">
            <strong style="font-size:22px;color:#1c271d;">Notebook</strong>
            <span style="font-size:14px;color:#52605d;">Save words and selected phrases, then revisit them here.</span>
          </div>
          <button id="clear-history" style="${dangerButtonStyle()}">Clear non-favorite history</button>
        </div>

        <div style="display:grid;grid-template-columns:minmax(0, 1fr) auto auto auto;gap:10px;align-items:center;">
          <input id="notebook-search" type="search" placeholder="Search word or translation" style="${fieldControlStyle()}" />
          <button data-filter="all" style="${filterButtonStyle()}" class="notebook-filter">All</button>
          <button data-filter="favorites" style="${filterButtonStyle()}" class="notebook-filter">Favorites</button>
          <button data-filter="history" style="${filterButtonStyle()}" class="notebook-filter">History</button>
        </div>

        <div id="notebook-summary" style="font-size:13px;color:#52605d;"></div>
        <div id="notebook-list" style="display:grid;gap:12px;"></div>
      </section>
    </section>
  </main>
`;

const targetLanguageSelect = document.querySelector('#target-language');
const sourceLanguageSelect = document.querySelector('#source-language');
const hoverDelayInput = document.querySelector('#hover-delay');
const hoverDelayLabel = document.querySelector('#hover-delay-label');
const pdfScaleInput = document.querySelector('#pdf-scale');
const pdfScaleLabel = document.querySelector('#pdf-scale-label');
const notebookSearchInput = document.querySelector('#notebook-search');
const notebookList = document.querySelector('#notebook-list');
const notebookSummary = document.querySelector('#notebook-summary');

targetLanguageSelect.value = settings.targetLanguage;
sourceLanguageSelect.value = settings.sourceLanguage;
hoverDelayLabel.textContent = `${settings.hoverDelayMs} ms`;
pdfScaleLabel.textContent = `${settings.pdfScale.toFixed(2)}x`;

renderNotebook();

targetLanguageSelect.addEventListener('change', async () => {
  await saveSettings({ targetLanguage: targetLanguageSelect.value });
});

sourceLanguageSelect.addEventListener('change', async () => {
  await saveSettings({ sourceLanguage: sourceLanguageSelect.value });
});

hoverDelayInput.addEventListener('input', async () => {
  const value = Number(hoverDelayInput.value);
  hoverDelayLabel.textContent = `${value} ms`;
  await saveSettings({ hoverDelayMs: value });
});

pdfScaleInput.addEventListener('input', async () => {
  const value = Number(pdfScaleInput.value);
  pdfScaleLabel.textContent = `${value.toFixed(2)}x`;
  await saveSettings({ pdfScale: value });
});

notebookSearchInput.addEventListener('input', () => {
  notebookSearch = notebookSearchInput.value.trim().toLowerCase();
  renderNotebook();
});

document.querySelectorAll('.notebook-filter').forEach((button) => {
  button.addEventListener('click', () => {
    notebookFilter = button.dataset.filter;
    renderNotebook();
  });
});

document.querySelector('#clear-history').addEventListener('click', async () => {
  await clearNotebookHistory();
  notebook = await getNotebook();
  renderNotebook();
});

notebookList.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const favoriteButton = target.closest('[data-action="favorite"]');
  if (favoriteButton instanceof HTMLElement) {
    const entryId = favoriteButton.dataset.id;
    if (!entryId) {
      return;
    }

    await setNotebookFavorite(entryId);
    notebook = await getNotebook();
    renderNotebook();
    return;
  }

  const deleteButton = target.closest('[data-action="delete"]');
  if (deleteButton instanceof HTMLElement) {
    const entryId = deleteButton.dataset.id;
    if (!entryId) {
      return;
    }

    await removeNotebookEntry(entryId);
    notebook = await getNotebook();
    renderNotebook();
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== 'local' || !changes.translationNotebook) {
    return;
  }

  notebook = await getNotebook();
  renderNotebook();
});

function renderNotebook() {
  const entries = notebook.entries.filter((entry) => {
    if (notebookFilter === 'favorites' && !entry.favorite) {
      return false;
    }

    if (notebookFilter === 'history' && entry.favorite) {
      return false;
    }

    if (!notebookSearch) {
      return true;
    }

    return (
      entry.sourceText.toLowerCase().includes(notebookSearch) ||
      entry.translatedText.toLowerCase().includes(notebookSearch)
    );
  });

  const favoriteCount = notebook.entries.filter((entry) => entry.favorite).length;
  notebookSummary.textContent = `${entries.length} shown · ${favoriteCount} favorites · ${notebook.entries.length - favoriteCount} history items`;

  document.querySelectorAll('.notebook-filter').forEach((button) => {
    button.style.background = button.dataset.filter === notebookFilter ? '#1a774f' : '#fff';
    button.style.color = button.dataset.filter === notebookFilter ? '#f6fff9' : '#314147';
    button.style.borderColor = button.dataset.filter === notebookFilter ? '#1a774f' : 'rgba(20,32,38,0.12)';
  });

  if (!entries.length) {
    notebookList.innerHTML = `
      <div style="padding:18px;border-radius:18px;background:#fff;border:1px dashed rgba(20,32,38,0.16);font-size:14px;color:#5f6c69;">
        No entries yet. Translate something on a page, then click the star button to save it to your notebook.
      </div>
    `;
    return;
  }

  notebookList.innerHTML = entries
    .map((entry) => {
      return `
        <article style="display:grid;gap:10px;padding:16px 18px;border-radius:18px;background:#fff;border:1px solid rgba(20,32,38,0.08);box-shadow:0 10px 24px rgba(22,34,31,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;">
            <div style="display:grid;gap:6px;">
              <div style="font-size:17px;font-weight:700;color:#1f2b25;word-break:break-word;">${escapeHtml(entry.sourceText)}</div>
              <div style="font-size:16px;color:#1a774f;word-break:break-word;">${escapeHtml(entry.translatedText)}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button data-action="favorite" data-id="${entry.id}" style="${inlineButtonStyle(entry.favorite ? '#1a774f' : '#fff7dd', entry.favorite ? '#f4fff8' : '#5e4a14', entry.favorite ? '#1a774f' : '#e7ca6a')}">
                ${entry.favorite ? 'Saved' : 'Save'}
              </button>
              <button data-action="delete" data-id="${entry.id}" style="${inlineButtonStyle('#fff', '#7b2f2f', 'rgba(123,47,47,0.18)')}">Delete</button>
            </div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#60706a;">
            <span>${entry.sourceLanguage} -> ${entry.targetLanguage}</span>
            <span>${entry.contextTypes.join(', ')}</span>
            <span>${entry.lookupCount}x</span>
            <span>${formatDate(entry.lastSeenAt)}</span>
          </div>
          ${entry.pageTitle ? `<div style="font-size:12px;color:#7a8782;word-break:break-word;">${escapeHtml(entry.pageTitle)}</div>` : ''}
        </article>
      `;
    })
    .join('');
}

function fieldCardStyle() {
  return `
    display:grid;
    gap:10px;
    padding:16px;
    border-radius:18px;
    background:#fffdf8;
    border:1px solid rgba(21,32,39,0.08);
    color:#243238;
    font-size:14px;
  `;
}

function fieldControlStyle() {
  return `
    width:100%;
    padding:11px 13px;
    border-radius:14px;
    border:1px solid rgba(20,32,38,0.12);
    background:#fff;
    font-size:14px;
  `;
}

function filterButtonStyle() {
  return `
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(20,32,38,0.12);
    background:#fff;
    color:#314147;
    font-size:14px;
    font-weight:700;
    cursor:pointer;
  `;
}

function dangerButtonStyle() {
  return `
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(123,47,47,0.16);
    background:#fff5f4;
    color:#7b2f2f;
    font-size:13px;
    font-weight:700;
    cursor:pointer;
  `;
}

function inlineButtonStyle(background, color, borderColor) {
  return `
    padding:8px 12px;
    border-radius:12px;
    border:1px solid ${borderColor};
    background:${background};
    color:${color};
    font-size:12px;
    font-weight:700;
    cursor:pointer;
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}
