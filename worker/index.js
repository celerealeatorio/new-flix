const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });

function cors(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
  if (allowed.includes(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "vary": "Origin"
    };
  }
  return {};
}

function allowedDomains(env) {
  return (env.ALLOWED_SOURCE_DOMAINS || "")
    .split(",").map(x => x.trim().toLowerCase())
    .filter(x => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(x));
}

async function tmdb(path, env) {
  if (!env.TMDB_API_KEY) throw new Error("TMDB_API_KEY não configurada no Worker.");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  url.searchParams.set("language", "pt-BR");
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`TMDB respondeu ${response.status}`);
  return response.json();
}

function normalizeTitle(item, mediaType = "movie") {
  return {
    id: item.id,
    mediaType,
    title: item.title || item.name || "Sem título",
    overview: item.overview || "",
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
    year: (item.release_date || item.first_air_date || "").slice(0, 4),
    rating: item.vote_average || null
  };
}

function rankSource(s) {
  const type = (s.type || "").toLowerCase();
  const name = (s.name || "").toLowerCase();
  let score = 0;
  if (type.includes("free") || type.includes("ads") || type.includes("grat")) score += 500;
  else if (type.includes("flatrate") || type.includes("stream")) score += 400;
  else if (type.includes("rent")) score += 200;
  else if (type.includes("buy")) score += 100;
  if (s.official) score += 80;
  if (s.registered) score += 40;
  if (name) score += 1;
  return score;
}

function tmdbSources(data) {
  const groups = data?.results?.BR || data?.results?.US || {};
  const out = [];
  for (const [type, providers] of Object.entries(groups)) {
    for (const p of (providers || [])) {
      out.push({
        name: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
        type,
        url: data?.results?.BR?.link || data?.results?.US?.link || null,
        official: true,
        registered: true,
        source: "TMDB"
      });
    }
  }
  return out;
}

async function braveSearch(title, year, env) {
  if (!env.BRAVE_API_KEY) return [];
  const domains = allowedDomains(env);
  if (!domains.length) return [];
  const siteFilter = domains.map(d => `site:${d}`).join(" OR ");
  const query = `${title} ${year || ""} assistir página oficial (${siteFilter})`;
  const params = new URLSearchParams({ q: query, count: "10", country: "BR", search_lang: "pt-br" });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { "X-Subscription-Token": env.BRAVE_API_KEY, "Accept": "application/json" }
  });
  if (!res.ok) return [];
  const body = await res.json();
  return (body.web?.results || []).map(r => {
    let host = "";
    try { host = new URL(r.url).hostname.toLowerCase(); } catch {}
    const approved = domains.some(d => host === d || host.endsWith(`.${d}`));
    return approved ? {
      name: host,
      title: r.title,
      description: r.description || "",
      url: r.url,
      type: "official_page",
      official: true,
      registered: true,
      source: "Busca automática"
    } : null;
  }).filter(Boolean);
}

async function handle(request, env) {
  const headers = cors(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/health") return json({ ok: true, service: "NEW FLIX API" }, 200, headers);

    if (url.pathname === "/api/search") {
      const q = (url.searchParams.get("q") || "").trim();
      const kind = url.searchParams.get("kind") || "multi";
      if (q.length < 2 || q.length > 100) return json({ error: "Digite pelo menos 2 caracteres." }, 400, headers);
      const endpoint = kind === "movie" ? "/search/movie" : kind === "tv" ? "/search/tv" : "/search/multi";
      const data = await tmdb(`${endpoint}?query=${encodeURIComponent(q)}&include_adult=false&region=BR`, env);
      const results = (data.results || [])
        .filter(x => x.media_type !== "person")
        .map(x => normalizeTitle(x, x.media_type || kind))
        .slice(0, 20);
      return json({ results }, 200, headers);
    }

    const match = url.pathname.match(/^\/api\/title\/(movie|tv)\/(\d+)\/sources$/);
    if (match) {
      const [, type, id] = match;
      const providerPath = type === "movie"
        ? `/movie/${id}/watch/providers`
        : `/tv/${id}/watch/providers`;
      const providers = await tmdb(providerPath, env);
      const sources = tmdbSources(providers);
      let detail = {};
      try { detail = await tmdb(`/${type}/${id}`, env); } catch {}
      const extra = await braveSearch(
        detail.title || detail.name || "",
        (detail.release_date || detail.first_air_date || "").slice(0, 4),
        env
      );
      const unique = [...sources, ...extra].filter((s, i, a) =>
        s.url ? a.findIndex(x => x.url === s.url) === i : a.findIndex(x => x.name === s.name && x.type === s.type) === i
      );
      unique.sort((a, b) => rankSource(b) - rankSource(a));
      return json({
        title: detail.title || detail.name || "",
        region: "BR",
        sources: unique,
        best: unique[0] || null,
        notice: unique.length
          ? "Disponibilidade informada por fontes externas; confirme no serviço."
          : "Nenhuma fonte autorizada foi encontrada para este título no Brasil."
      }, 200, headers);
    }

    return json({ error: "Rota não encontrada." }, 404, headers);
  } catch (e) {
    return json({ error: e.message || "Erro interno." }, 500, headers);
  }
}

export default { fetch: handle };
