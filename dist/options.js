import{g as z,s as c}from"./chunks/storage.js";import{L as m}from"./chunks/languages.js";import{a as l,c as T,s as C,r as D}from"./chunks/notebook.js";import"./chunks/defaults.js";const i=await z();let o=await l(),n="all",p="";document.body.style.margin="0";document.body.style.background="#f4efe4";document.body.style.fontFamily='"Avenir Next", "PingFang SC", sans-serif';document.querySelector("#app").innerHTML=`
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
        <label style="${d()}">
          <span>Target language</span>
          <select id="target-language" style="${f()}">
            ${m.map(t=>`<option value="${t.value}">${t.label}</option>`).join("")}
          </select>
        </label>

        <label style="${d()}">
          <span>Source language</span>
          <select id="source-language" style="${f()}">
            <option value="auto">Auto detect</option>
            ${m.map(t=>`<option value="${t.value}">${t.label}</option>`).join("")}
          </select>
        </label>

        <label style="${d()}">
          <span>Hover delay</span>
          <input id="hover-delay" type="range" min="350" max="1800" step="50" value="${i.hoverDelayMs}" />
          <strong id="hover-delay-label" style="font-size:14px;color:#314147;"></strong>
        </label>

        <label style="${d()}">
          <span>PDF zoom</span>
          <input id="pdf-scale" type="range" min="0.9" max="2.2" step="0.05" value="${i.pdfScale}" />
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
          <button id="clear-history" style="${F()}">Clear non-favorite history</button>
        </div>

        <div style="display:grid;grid-template-columns:minmax(0, 1fr) auto auto auto;gap:10px;align-items:center;">
          <input id="notebook-search" type="search" placeholder="Search word or translation" style="${f()}" />
          <button data-filter="all" style="${u()}" class="notebook-filter">All</button>
          <button data-filter="favorites" style="${u()}" class="notebook-filter">Favorites</button>
          <button data-filter="history" style="${u()}" class="notebook-filter">History</button>
        </div>

        <div id="notebook-summary" style="font-size:13px;color:#52605d;"></div>
        <div id="notebook-list" style="display:grid;gap:12px;"></div>
      </section>
    </section>
  </main>
`;const b=document.querySelector("#target-language"),x=document.querySelector("#source-language"),h=document.querySelector("#hover-delay"),S=document.querySelector("#hover-delay-label"),w=document.querySelector("#pdf-scale"),L=document.querySelector("#pdf-scale-label"),k=document.querySelector("#notebook-search"),y=document.querySelector("#notebook-list"),E=document.querySelector("#notebook-summary");b.value=i.targetLanguage;x.value=i.sourceLanguage;S.textContent=`${i.hoverDelayMs} ms`;L.textContent=`${i.pdfScale.toFixed(2)}x`;r();b.addEventListener("change",async()=>{await c({targetLanguage:b.value})});x.addEventListener("change",async()=>{await c({sourceLanguage:x.value})});h.addEventListener("input",async()=>{const t=Number(h.value);S.textContent=`${t} ms`,await c({hoverDelayMs:t})});w.addEventListener("input",async()=>{const t=Number(w.value);L.textContent=`${t.toFixed(2)}x`,await c({pdfScale:t})});k.addEventListener("input",()=>{p=k.value.trim().toLowerCase(),r()});document.querySelectorAll(".notebook-filter").forEach(t=>{t.addEventListener("click",()=>{n=t.dataset.filter,r()})});document.querySelector("#clear-history").addEventListener("click",async()=>{await T(),o=await l(),r()});y.addEventListener("click",async t=>{const a=t.target;if(!(a instanceof HTMLElement))return;const e=a.closest('[data-action="favorite"]');if(e instanceof HTMLElement){const s=e.dataset.id;if(!s)return;await C(s),o=await l(),r();return}const v=a.closest('[data-action="delete"]');if(v instanceof HTMLElement){const s=v.dataset.id;if(!s)return;await D(s),o=await l(),r()}});chrome.storage.onChanged.addListener(async(t,a)=>{a!=="local"||!t.translationNotebook||(o=await l(),r())});function r(){const t=o.entries.filter(e=>n==="favorites"&&!e.favorite||n==="history"&&e.favorite?!1:p?e.sourceText.toLowerCase().includes(p)||e.translatedText.toLowerCase().includes(p):!0),a=o.entries.filter(e=>e.favorite).length;if(E.textContent=`${t.length} shown · ${a} favorites · ${o.entries.length-a} history items`,document.querySelectorAll(".notebook-filter").forEach(e=>{e.style.background=e.dataset.filter===n?"#1a774f":"#fff",e.style.color=e.dataset.filter===n?"#f6fff9":"#314147",e.style.borderColor=e.dataset.filter===n?"#1a774f":"rgba(20,32,38,0.12)"}),!t.length){y.innerHTML=`
      <div style="padding:18px;border-radius:18px;background:#fff;border:1px dashed rgba(20,32,38,0.16);font-size:14px;color:#5f6c69;">
        No entries yet. Translate something on a page, then click the star button to save it to your notebook.
      </div>
    `;return}y.innerHTML=t.map(e=>`
        <article style="display:grid;gap:10px;padding:16px 18px;border-radius:18px;background:#fff;border:1px solid rgba(20,32,38,0.08);box-shadow:0 10px 24px rgba(22,34,31,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;">
            <div style="display:grid;gap:6px;">
              <div style="font-size:17px;font-weight:700;color:#1f2b25;word-break:break-word;">${g(e.sourceText)}</div>
              <div style="font-size:16px;color:#1a774f;word-break:break-word;">${g(e.translatedText)}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button data-action="favorite" data-id="${e.id}" style="${$(e.favorite?"#1a774f":"#fff7dd",e.favorite?"#f4fff8":"#5e4a14",e.favorite?"#1a774f":"#e7ca6a")}">
                ${e.favorite?"Saved":"Save"}
              </button>
              <button data-action="delete" data-id="${e.id}" style="${$("#fff","#7b2f2f","rgba(123,47,47,0.18)")}">Delete</button>
            </div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#60706a;">
            <span>${e.sourceLanguage} -> ${e.targetLanguage}</span>
            <span>${e.contextTypes.join(", ")}</span>
            <span>${e.lookupCount}x</span>
            <span>${q(e.lastSeenAt)}</span>
          </div>
          ${e.pageTitle?`<div style="font-size:12px;color:#7a8782;word-break:break-word;">${g(e.pageTitle)}</div>`:""}
        </article>
      `).join("")}function d(){return`
    display:grid;
    gap:10px;
    padding:16px;
    border-radius:18px;
    background:#fffdf8;
    border:1px solid rgba(21,32,39,0.08);
    color:#243238;
    font-size:14px;
  `}function f(){return`
    width:100%;
    padding:11px 13px;
    border-radius:14px;
    border:1px solid rgba(20,32,38,0.12);
    background:#fff;
    font-size:14px;
  `}function u(){return`
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(20,32,38,0.12);
    background:#fff;
    color:#314147;
    font-size:14px;
    font-weight:700;
    cursor:pointer;
  `}function F(){return`
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(123,47,47,0.16);
    background:#fff5f4;
    color:#7b2f2f;
    font-size:13px;
    font-weight:700;
    cursor:pointer;
  `}function $(t,a,e){return`
    padding:8px 12px;
    border-radius:12px;
    border:1px solid ${e};
    background:${t};
    color:${a};
    font-size:12px;
    font-weight:700;
    cursor:pointer;
  `}function g(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function q(t){return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short"}).format(new Date(t))}
