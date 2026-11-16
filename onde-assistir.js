const API = (window.NEW_FLIX_CONFIG?.API_BASE || "").replace(/\/$/, "");
const $ = (s) => document.querySelector(s);
const form = $("#searchForm"), input = $("#query"), statusEl = $("#status");
let lastResults = [];

function setStatus(text){ statusEl.textContent = text; }
function safeText(value=""){ return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

async function api(path){
  if(!API || API.includes("SEU-WORKER")) throw new Error("Configure a URL da API em web/config.js.");
  const res = await fetch(`${API}${path}`);
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || "Falha na API.");
  return data;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const q = input.value.trim();
  if(q.length < 2) return;
  $("#detailSection").classList.add("hidden");
  $("#resultsSection").classList.remove("hidden");
  $("#results").innerHTML = "";
  setStatus("Pesquisando catálogo...");
  try{
    const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
    lastResults = data.results || [];
    $("#count").textContent = `${lastResults.length} títulos`;
    $("#results").innerHTML = lastResults.map((m,i)=>`
      <button class="movie" data-index="${i}">
        <img loading="lazy" src="${m.poster || ""}" alt="">
        <span class="meta"><strong>${safeText(m.title)}</strong><small>${safeText(m.year || "Ano não informado")} · ${m.mediaType === "tv" ? "Série" : "Filme"}</small></span>
      </button>`).join("");
    if(!lastResults.length) setStatus("Nenhum título encontrado.");
    else setStatus("Selecione um título para consultar onde assistir.");
    $("#results").querySelectorAll(".movie").forEach(btn => btn.addEventListener("click",()=>showTitle(lastResults[Number(btn.dataset.index)])));
  }catch(err){setStatus(err.message);}
});

async function showTitle(m){
  $("#resultsSection").classList.add("hidden");
  $("#detailSection").classList.remove("hidden");
  $("#detailContent").innerHTML = `<p class="muted">Consultando fontes autorizadas...</p>`;
  try{
    const type = m.mediaType === "tv" ? "tv" : "movie";
    const data = await api(`/api/title/${type}/${m.id}/sources`);
    const best = data.best;
    const sources = data.sources || [];
    const sourceMarkup = sources.length ? sources.map((s,i)=>`
      <div class="source ${i===0?"best":""}">
        ${s.logo ? `<img src="${s.logo}" alt="">` : `<span>▶</span>`}
        <div><strong>${safeText(s.name || "Fonte oficial")}</strong><div class="muted">${safeText(s.type || "Página oficial")} · ${safeText(s.source || "")}</div></div>
        ${i===0?'<span class="pill">MELHOR OPÇÃO</span>':""}
        ${s.url ? `<a href="${safeText(s.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a>` : ""}
      </div>`).join("") : `<p class="muted">${safeText(data.notice)}</p>`;
    $("#detailContent").innerHTML = `
      <div class="feature">
        <img src="${m.poster || ""}" alt="">
        <div><h2>${safeText(m.title)}</h2><p class="muted">${safeText(m.year || "")} · ${type==="tv"?"Série":"Filme"} · Nota TMDB ${m.rating ? Number(m.rating).toFixed(1) : "—"}</p>
        <p>${safeText(m.overview || "Sinopse não disponível.")}</p>
        <h3>Onde assistir</h3>
        <p class="muted">${safeText(data.notice || "")}</p>
        <div class="sources">${sourceMarkup}</div>
        </div>
      </div>`;
  }catch(err){$("#detailContent").innerHTML = `<p class="muted">${safeText(err.message)}</p>`;}
}
$("#back").addEventListener("click",()=>{$("#detailSection").classList.add("hidden");$("#resultsSection").classList.remove("hidden");});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
