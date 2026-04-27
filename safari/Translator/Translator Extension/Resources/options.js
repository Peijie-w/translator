import"./chunks/modulepreload-polyfill.js";import{g as F,a as v,s as f,b as E}from"./chunks/storage.js";import{L}from"./chunks/languages.js";import{a as u,c as I,s as N,r as H}from"./chunks/notebook.js";const h=[{value:"google-web",label:"Google Web (Prototype)",description:"Fast prototype mode based on the current unofficial web endpoint."},{value:"libretranslate",label:"LibreTranslate",description:"Use a self-hosted or third-party LibreTranslate-compatible API."}];function M(e){return h.find(a=>a.value===e)??h[0]}const o=await F();let n=await v(),i=await u(),d="all",g="";document.body.style.margin="0";document.body.style.background="#f4efe4";document.body.style.fontFamily='"Avenir Next", "PingFang SC", sans-serif';document.querySelector("#app").innerHTML=`
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
        <label style="${r()}">
          <span>Target language</span>
          <select id="target-language" style="${s()}">
            ${L.map(e=>`<option value="${e.value}">${e.label}</option>`).join("")}
          </select>
        </label>

        <label style="${r()}">
          <span>Source language</span>
          <select id="source-language" style="${s()}">
            <option value="auto">Auto detect</option>
            ${L.map(e=>`<option value="${e.value}">${e.label}</option>`).join("")}
          </select>
        </label>

        <label style="${r()}">
          <span>Hover delay</span>
          <input id="hover-delay" type="range" min="350" max="1800" step="50" value="${o.hoverDelayMs}" />
          <strong id="hover-delay-label" style="font-size:14px;color:#314147;"></strong>
        </label>

        <label style="${r()}">
          <span>PDF zoom</span>
          <input id="pdf-scale" type="range" min="0.9" max="2.2" step="0.05" value="${o.pdfScale}" />
          <strong id="pdf-scale-label" style="font-size:14px;color:#314147;"></strong>
        </label>
      </section>

      <section style="display:grid;gap:16px;padding:22px;border-radius:24px;background:#fffdf8;border:1px solid rgba(20,32,38,0.08);">
        <div style="display:grid;gap:6px;">
          <strong style="font-size:22px;color:#1c271d;">Translation provider</strong>
          <span style="font-size:14px;color:#52605d;">Choose how the extension fetches translations. Google Web stays as the default prototype path, while LibreTranslate lets you plug in a proper hosted API.</span>
        </div>

        <label style="${r()}">
          <span>Provider</span>
          <select id="translation-provider" style="${s()}">
            ${h.map(e=>`<option value="${e.value}">${e.label}</option>`).join("")}
          </select>
          <strong id="translation-provider-description" style="font-size:13px;color:#5f6c69;"></strong>
        </label>

        <div id="libretranslate-settings" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:18px;">
          <label style="${r()}">
            <span>LibreTranslate endpoint</span>
            <input id="libretranslate-endpoint" type="url" placeholder="https://your-server.example/translate" style="${s()}" />
          </label>

          <label style="${r()}">
            <span>LibreTranslate API key</span>
            <input id="libretranslate-api-key" type="password" placeholder="Optional" style="${s()}" />
          </label>
        </div>
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
          <button id="clear-history" style="${U()}">Clear non-favorite history</button>
        </div>

        <div style="display:grid;grid-template-columns:minmax(0, 1fr) auto auto auto;gap:10px;align-items:center;">
          <input id="notebook-search" type="search" placeholder="Search word or translation" style="${s()}" />
          <button data-filter="all" style="${x()}" class="notebook-filter">All</button>
          <button data-filter="favorites" style="${x()}" class="notebook-filter">Favorites</button>
          <button data-filter="history" style="${x()}" class="notebook-filter">History</button>
        </div>

        <div id="notebook-summary" style="font-size:13px;color:#52605d;"></div>
        <div id="notebook-list" style="display:grid;gap:12px;"></div>
      </section>
    </section>
  </main>
`;const w=document.querySelector("#target-language"),k=document.querySelector("#source-language"),T=document.querySelector("#hover-delay"),A=document.querySelector("#hover-delay-label"),z=document.querySelector("#pdf-scale"),q=document.querySelector("#pdf-scale-label"),p=document.querySelector("#translation-provider"),j=document.querySelector("#translation-provider-description"),O=document.querySelector("#libretranslate-settings"),b=document.querySelector("#libretranslate-endpoint"),y=document.querySelector("#libretranslate-api-key"),P=document.querySelector("#notebook-search"),$=document.querySelector("#notebook-list"),B=document.querySelector("#notebook-summary");w.value=o.targetLanguage;k.value=o.sourceLanguage;A.textContent=`${o.hoverDelayMs} ms`;q.textContent=`${o.pdfScale.toFixed(2)}x`;p.value=o.translationProvider;b.value=n.libreTranslateEndpoint;y.value=n.libreTranslateApiKey;D();l();w.addEventListener("change",async()=>{await f({targetLanguage:w.value})});k.addEventListener("change",async()=>{await f({sourceLanguage:k.value})});T.addEventListener("input",async()=>{const e=Number(T.value);A.textContent=`${e} ms`,await f({hoverDelayMs:e})});z.addEventListener("input",async()=>{const e=Number(z.value);q.textContent=`${e.toFixed(2)}x`,await f({pdfScale:e})});p.addEventListener("change",async()=>{await f({translationProvider:p.value}),o.translationProvider=p.value,D()});b.addEventListener("change",async()=>{await E({libreTranslateEndpoint:b.value.trim()}),n=await v()});y.addEventListener("change",async()=>{await E({libreTranslateApiKey:y.value.trim()}),n=await v()});P.addEventListener("input",()=>{g=P.value.trim().toLowerCase(),l()});document.querySelectorAll(".notebook-filter").forEach(e=>{e.addEventListener("click",()=>{d=e.dataset.filter,l()})});document.querySelector("#clear-history").addEventListener("click",async()=>{await I(),i=await u(),l()});$.addEventListener("click",async e=>{const a=e.target;if(!(a instanceof HTMLElement))return;const t=a.closest('[data-action="favorite"]');if(t instanceof HTMLElement){const c=t.dataset.id;if(!c)return;await N(c),i=await u(),l();return}const S=a.closest('[data-action="delete"]');if(S instanceof HTMLElement){const c=S.dataset.id;if(!c)return;await H(c),i=await u(),l()}});chrome.storage.onChanged.addListener(async(e,a)=>{if(a!=="local"||!e.translationNotebook){a==="local"&&e.translationProviderConfig&&(n=await v(),b.value=n.libreTranslateEndpoint,y.value=n.libreTranslateApiKey);return}i=await u(),l()});function D(){const e=M(p.value);j.textContent=e.description,O.style.display=p.value==="libretranslate"?"grid":"none"}function l(){const e=i.entries.filter(t=>d==="favorites"&&!t.favorite||d==="history"&&t.favorite?!1:g?t.sourceText.toLowerCase().includes(g)||t.translatedText.toLowerCase().includes(g):!0),a=i.entries.filter(t=>t.favorite).length;if(B.textContent=`${e.length} shown · ${a} favorites · ${i.entries.length-a} history items`,document.querySelectorAll(".notebook-filter").forEach(t=>{t.style.background=t.dataset.filter===d?"#1a774f":"#fff",t.style.color=t.dataset.filter===d?"#f6fff9":"#314147",t.style.borderColor=t.dataset.filter===d?"#1a774f":"rgba(20,32,38,0.12)"}),!e.length){$.innerHTML=`
      <div style="padding:18px;border-radius:18px;background:#fff;border:1px dashed rgba(20,32,38,0.16);font-size:14px;color:#5f6c69;">
        No entries yet. Translate something on a page, then click the star button to save it to your notebook.
      </div>
    `;return}$.innerHTML=e.map(t=>`
        <article style="display:grid;gap:10px;padding:16px 18px;border-radius:18px;background:#fff;border:1px solid rgba(20,32,38,0.08);box-shadow:0 10px 24px rgba(22,34,31,0.06);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;">
            <div style="display:grid;gap:6px;">
              <div style="font-size:17px;font-weight:700;color:#1f2b25;word-break:break-word;">${m(t.sourceText)}</div>
              <div style="font-size:16px;color:#1a774f;word-break:break-word;">${m(t.translatedText)}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button data-action="favorite" data-id="${t.id}" style="${C(t.favorite?"#1a774f":"#fff7dd",t.favorite?"#f4fff8":"#5e4a14",t.favorite?"#1a774f":"#e7ca6a")}">
                ${t.favorite?"Saved":"Save"}
              </button>
              <button data-action="delete" data-id="${t.id}" style="${C("#fff","#7b2f2f","rgba(123,47,47,0.18)")}">Delete</button>
            </div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#60706a;">
            <span>${t.sourceLanguage} -> ${t.targetLanguage}</span>
            <span>${t.contextTypes.join(", ")}</span>
            <span>${t.lookupCount}x</span>
            <span>${G(t.lastSeenAt)}</span>
          </div>
          ${t.pageTitle?`<div style="font-size:12px;color:#7a8782;word-break:break-word;">${m(t.pageTitle)}</div>`:""}
        </article>
      `).join("")}function r(){return`
    display:grid;
    gap:10px;
    padding:16px;
    border-radius:18px;
    background:#fffdf8;
    border:1px solid rgba(21,32,39,0.08);
    color:#243238;
    font-size:14px;
  `}function s(){return`
    width:100%;
    padding:11px 13px;
    border-radius:14px;
    border:1px solid rgba(20,32,38,0.12);
    background:#fff;
    font-size:14px;
  `}function x(){return`
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(20,32,38,0.12);
    background:#fff;
    color:#314147;
    font-size:14px;
    font-weight:700;
    cursor:pointer;
  `}function U(){return`
    padding:11px 14px;
    border-radius:14px;
    border:1px solid rgba(123,47,47,0.16);
    background:#fff5f4;
    color:#7b2f2f;
    font-size:13px;
    font-weight:700;
    cursor:pointer;
  `}function C(e,a,t){return`
    padding:8px 12px;
    border-radius:12px;
    border:1px solid ${t};
    background:${e};
    color:${a};
    font-size:12px;
    font-weight:700;
    cursor:pointer;
  `}function m(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function G(e){return new Intl.DateTimeFormat(void 0,{dateStyle:"medium",timeStyle:"short"}).format(new Date(e))}
