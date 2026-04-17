import { getSettings, saveSettings } from '../shared/storage.js';
import { LANGUAGE_OPTIONS } from '../shared/languages.js';

const settings = await getSettings();

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
    </section>
  </main>
`;

const targetLanguageSelect = document.querySelector('#target-language');
const sourceLanguageSelect = document.querySelector('#source-language');
const hoverDelayInput = document.querySelector('#hover-delay');
const hoverDelayLabel = document.querySelector('#hover-delay-label');
const pdfScaleInput = document.querySelector('#pdf-scale');
const pdfScaleLabel = document.querySelector('#pdf-scale-label');

targetLanguageSelect.value = settings.targetLanguage;
sourceLanguageSelect.value = settings.sourceLanguage;
hoverDelayLabel.textContent = `${settings.hoverDelayMs} ms`;
pdfScaleLabel.textContent = `${settings.pdfScale.toFixed(2)}x`;

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
