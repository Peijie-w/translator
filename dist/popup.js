import{g as s,s as l}from"./chunks/storage.js";import{L as u}from"./chunks/languages.js";const r=await s(),t=await p();document.body.style.margin="0";document.body.innerHTML=`
  <main style="${b()}">
    <section style="${y()}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="font-size:20px;font-weight:700;">Ubersetzer</div>
          <div style="font-size:12px;opacity:0.68;margin-top:4px;">Hover over a word to translate it after a short delay.</div>
        </div>
        <button id="open-options" style="${i()}">Settings</button>
      </div>

      <label style="${o()}">
        <span>Target language</span>
        <select id="target-language" style="${f()}">
          ${u.map(e=>`<option value="${e.value}">${e.label}</option>`).join("")}
        </select>
      </label>

      <label style="${o()}">
        <span>Hover delay: <strong id="delay-label"></strong></span>
        <input id="hover-delay" type="range" min="350" max="1800" step="50" value="${r.hoverDelayMs}" />
      </label>

      <button id="open-viewer" style="${v()}" ${g(t?.url)?"":"disabled"}>
        Open current PDF in viewer
      </button>

      <button id="open-empty-viewer" style="${i()}">Open standalone PDF viewer</button>
    </section>
  </main>
`;const n=document.querySelector("#target-language"),a=document.querySelector("#hover-delay"),d=document.querySelector("#delay-label"),c=document.querySelector("#open-viewer");n.value=r.targetLanguage;d.textContent=`${r.hoverDelayMs} ms`;n.addEventListener("change",async()=>{await l({targetLanguage:n.value})});a.addEventListener("input",async()=>{const e=Number(a.value);d.textContent=`${e} ms`,await l({hoverDelayMs:e})});document.querySelector("#open-options").addEventListener("click",()=>{chrome.runtime.openOptionsPage()});c.addEventListener("click",async()=>{t?.url&&(await chrome.tabs.create({url:chrome.runtime.getURL(`viewer.html?file=${encodeURIComponent(t.url)}`)}),window.close())});document.querySelector("#open-empty-viewer").addEventListener("click",async()=>{await chrome.tabs.create({url:chrome.runtime.getURL("viewer.html")}),window.close()});async function p(){const[e]=await chrome.tabs.query({active:!0,currentWindow:!0});return e}function g(e){return!!(e&&/\.pdf(?:$|[?#])/i.test(e))}function b(){return`
    width: 340px;
    padding: 16px;
    background:
      radial-gradient(circle at top right, rgba(245, 181, 67, 0.3), transparent 38%),
      linear-gradient(160deg, #13202b, #0f1723 48%, #1b1126 100%);
    color: #f8fbff;
    font-family: "Avenir Next", "PingFang SC", sans-serif;
    box-sizing: border-box;
  `}function y(){return`
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    box-shadow: 0 22px 40px rgba(0,0,0,0.26);
  `}function o(){return`
    display: grid;
    gap: 8px;
    font-size: 13px;
  `}function f(){return`
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.12);
    color: #f8fbff;
  `}function v(){return`
    padding: 12px 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #ffcf70, #ff8c42);
    color: #1e120b;
    font-weight: 700;
    cursor: pointer;
  `}function i(){return`
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
    color: #f8fbff;
    font-weight: 600;
    cursor: pointer;
  `}
