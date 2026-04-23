import { getSettings, saveSettings } from '../shared/storage.js';
import { LANGUAGE_OPTIONS } from '../shared/languages.js';
import { getNotebookStats } from '../shared/notebook.js';

const settings = await getSettings();
const notebookStats = await getNotebookStats();
const currentTab = await getCurrentTab();

document.body.style.margin = '0';
document.body.innerHTML = `
  <main style="${pageStyle()}">
    <section style="${cardStyle()}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="font-size:20px;font-weight:700;">Ubersetzer</div>
          <div style="font-size:12px;opacity:0.68;margin-top:4px;">Hover over a word to translate it after a short delay.</div>
        </div>
        <button id="open-options" style="${secondaryButtonStyle()}">Settings</button>
      </div>

      <label style="${fieldStyle()}">
        <span>Target language</span>
        <select id="target-language" style="${inputStyle()}">
          ${LANGUAGE_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
        </select>
      </label>

      <label style="${fieldStyle()}">
        <span>Hover delay: <strong id="delay-label"></strong></span>
        <input id="hover-delay" type="range" min="350" max="1800" step="50" value="${settings.hoverDelayMs}" />
      </label>

      <section style="${summaryStyle()}">
        <div style="font-size:13px;font-weight:700;">Notebook</div>
        <div style="font-size:12px;opacity:0.78;line-height:1.5;">
          ${notebookStats.favoriteCount} favorites · ${notebookStats.historyCount} history entries
        </div>
        <button id="open-notebook" style="${secondaryButtonStyle()}">Open notebook</button>
      </section>

      <button id="open-viewer" style="${primaryButtonStyle()}" ${isLikelyPdf(currentTab?.url) ? '' : 'disabled'}>
        Open current PDF in viewer
      </button>

      <button id="open-empty-viewer" style="${secondaryButtonStyle()}">Open standalone PDF viewer</button>
    </section>
  </main>
`;

const languageSelect = document.querySelector('#target-language');
const hoverDelayInput = document.querySelector('#hover-delay');
const delayLabel = document.querySelector('#delay-label');
const openViewerButton = document.querySelector('#open-viewer');

languageSelect.value = settings.targetLanguage;
delayLabel.textContent = `${settings.hoverDelayMs} ms`;

languageSelect.addEventListener('change', async () => {
  await saveSettings({ targetLanguage: languageSelect.value });
});

hoverDelayInput.addEventListener('input', async () => {
  const value = Number(hoverDelayInput.value);
  delayLabel.textContent = `${value} ms`;
  await saveSettings({ hoverDelayMs: value });
});

document.querySelector('#open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.querySelector('#open-notebook').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

openViewerButton.addEventListener('click', async () => {
  if (!currentTab?.url) {
    return;
  }

  await chrome.tabs.create({
    url: chrome.runtime.getURL(`viewer.html?file=${encodeURIComponent(currentTab.url)}`)
  });
  window.close();
});

document.querySelector('#open-empty-viewer').addEventListener('click', async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
  window.close();
});

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isLikelyPdf(url) {
  return Boolean(url && /\.pdf(?:$|[?#])/i.test(url));
}

function pageStyle() {
  return `
    width: 340px;
    padding: 16px;
    background:
      radial-gradient(circle at top right, rgba(245, 181, 67, 0.3), transparent 38%),
      linear-gradient(160deg, #13202b, #0f1723 48%, #1b1126 100%);
    color: #f8fbff;
    font-family: "Avenir Next", "PingFang SC", sans-serif;
    box-sizing: border-box;
  `;
}

function cardStyle() {
  return `
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    box-shadow: 0 22px 40px rgba(0,0,0,0.26);
  `;
}

function fieldStyle() {
  return `
    display: grid;
    gap: 8px;
    font-size: 13px;
  `;
}

function summaryStyle() {
  return `
    display:grid;
    gap:8px;
    padding:12px;
    border-radius:16px;
    background:rgba(255,255,255,0.08);
    border:1px solid rgba(255,255,255,0.1);
  `;
}

function inputStyle() {
  return `
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.12);
    color: #f8fbff;
  `;
}

function primaryButtonStyle() {
  return `
    padding: 12px 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #ffcf70, #ff8c42);
    color: #1e120b;
    font-weight: 700;
    cursor: pointer;
  `;
}

function secondaryButtonStyle() {
  return `
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
    color: #f8fbff;
    font-weight: 600;
    cursor: pointer;
  `;
}
