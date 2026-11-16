# API do NEWFLIX — Onde Assistir (Cloudflare Worker)

Busca filmes/séries no TMDB (capas e metadados) e mostra **onde assistir legalmente**
(provedores oficiais no Brasil). Nada de streams piratas: o Worker não extrai vídeo,
não contorna DRM e só pesquisa em domínios cadastrados.

## Configuração (uma vez, ~10 minutos, gratuito)

1. **Chave TMDB**: crie conta em https://www.themoviedb.org/settings/api
   → "Create" → "Developer" → copie a **API Key (v3)**
2. **Cloudflare**: crie conta grátis em https://dash.cloudflare.com (Workers é gratuito: 100 mil requisições/dia)
3. No seu computador (precisa de Node.js):
   ```bash
   cd worker
   npm install
   npx wrangler login
   npx wrangler secret put TMDB_API_KEY   # cole a chave do TMDB
   npx wrangler deploy
   ```
4. O terminal mostra a URL do Worker (ex.: `https://new-flix-api.SUA-CONTA.workers.dev`)
5. Edite `config.js` (na pasta raiz do site) e coloque essa URL em `API_BASE`
6. Faça commit do `config.js` atualizado

Pronto: a página **Onde Assistir** passa a funcionar com capas e fontes oficiais.

## Opcional — busca ampliada (Brave Search API)

Permite procurar páginas oficiais em domínios cadastrados:

```bash
npx wrangler secret put BRAVE_API_KEY
```

Plano gratuito do Brave: 2.000 consultas/mês. Sem essa chave, o Worker usa só os
provedores do TMDB (já cobre a maioria dos títulos no Brasil).

## Segurança

- As chaves ficam como **secret no Worker** — nunca no site
- O CORS aceita somente a origem configurada em `wrangler.toml` (`ALLOWED_ORIGINS`)
- A busca automática fica limitada a `ALLOWED_SOURCE_DOMAINS` — cadastre apenas
  plataformas oficiais e legais; nunca sites que redistribuam obras sem licença
