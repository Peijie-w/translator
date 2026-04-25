import{g as u,s as d}from"./chunks/storage.js";import{L as c}from"./chunks/languages.js";import{g as p}from"./chunks/notebook.js";import"./chunks/defaults.js";const r=await u(),a=await p(),n=await b();document.body.style.margin="0";document.body.innerHTML=`
  <main style="${f()}">
    <section style="${m()}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="font-size:20px;font-weight:700;">Ubersetzer</div>
          <div style="font-size:12px;opacity:0.68;margin-top:4px;">Hover over a word to translate it after a short delay.</div>
        </div>
        <button id="open-options" style="${t()}">Settings</button>
      </div>

      <label style="${s()}">
        <span>Target language</span>
        <select id="target-language" style="${x()}">
          ${c.map(e=>`<option value="${e.value}">${e.label}</option>`).join("")}
        </select>
      </label>

      <label style="${s()}">
        <span>Hover delay: <strong id="delay-label"></strong></span>
        <input id="hover-delay" type="range" min="350" max="1800" step="50" value="${r.hoverDelayMs}" />
      </label>

      <section style="${v()}">
        <div style="font-size:13px;font-weight:700;">Notebook</div>
        <div style="font-size:12px;opacity:0.78;line-height:1.5;">
          ${a.favoriteCount} favorites · ${a.historyCount} history entries
        </div>
        <button id="open-notebook" style="${t()}">Open notebook</button>
      </section>

      <button id="open-viewer" style="${w()}" ${y(n?.url)?"":"disabled"}>
        Open current PDF in viewer
      </button>

      <button id="open-empty-viewer" style="${t()}">Open standalone PDF viewer</button>
    </section>
  </main>
`;const o=document.querySelector("#target-language"),i=document.querySelector("#hover-delay"),l=document.querySelector("#delay-label"),g=document.querySelector("#open-viewer");o.value=r.targetLanguage;l.textContent=`${r.hoverDelayMs} ms`;o.addEventListener("change",async()=>{await d({targetLanguage:o.value})});i.addEventListener("input",async()=>{const e=Number(i.value);l.textContent=`${e} ms`,await d({hoverDelayMs:e})});document.querySelector("#open-options").addEventListener("click",()=>{chrome.runtime.openOptionsPage()});document.querySelector("#open-notebook").addEventListener("click",()=>{chrome.runtime.openOptionsPage()});g.addEventListener("click",async()=>{n?.url&&(await chrome.tabs.create({url:chrome.runtime.getURL(`viewer.html?file=${encodeURIComponent(n.url)}`)}),window.close())});document.querySelector("#open-empty-viewer").addEventListener("click",async()=>{await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html")}),window.close()});async function b(){const[e]=await chrome.tabs.query({active:!0,currentWindow:!0});return e}function y(e){return!!(e&&/\.pdf(?:$|[?#])/i.test(e))}function f(){return`
    width: 340px;
    padding: 16px;
    background:
      radial-gradient(circle at top right, rgba(245, 181, 67, 0.3), transparent 38%),
      linear-gradient(160deg, #13202b, #0f1723 48%, #1b1126 100%);
    color: #f8fbff;
    font-family: "Avenir Next", "PingFang SC", sans-serif;
    box-sizing: border-box;
  `}function m(){return`
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    box-shadow: 0 22px 40px rgba(0,0,0,0.26);
  `}function s(){return`
    display: grid;
    gap: 8px;
    font-size: 13px;
  `}function v(){return`
    display:grid;
    gap:8px;
    padding:12px;
    border-radius:16px;
    background:rgba(255,255,255,0.08);
    border:1px solid rgba(255,255,255,0.1);
  `}function x(){return`
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.12);
    color: #f8fbff;
  `}function w(){return`
    padding: 12px 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #ffcf70, #ff8c42);
    color: #1e120b;
    font-weight: 700;
    cursor: pointer;
  `}function t(){return`
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
    color: #f8fbff;
    font-weight: 600;
    cursor: pointer;
  `}
