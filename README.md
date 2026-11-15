# 📺 NEWFLIX — IPTV Player (PWA com controle de acesso e tempo)

Player de IPTV estilo Netflix (tema preto, linhas vermelhas) com **login por usuário**, **liberação seletiva de canais** e **tempo de acesso com bloqueio automático**.

## Recursos

- 🎬 Tema profissional preto/vermelho estilo Netflix, com grade de canais em cards
- 🔐 Login por **usuário + chave** — sem credencial válida, nada carrega
- 📋 **Catálogo de canais** no painel admin: importe suas listas M3U uma vez e libere **canais específicos** para cada usuário (sem precisar entregar M3U)
- ⏳ **Tempo de acesso**: ilimitado ou por X minutos — contagem regressiva no topo e **bloqueio automático** ao expirar (inclusive durante a reprodução)
- ⭐ Favoritos, 🕐 recentes, busca, filtro por grupo, tela cheia
- 📲 Instalável no Android (PWA), interface funciona offline
- 🔒 Links das playlists **criptografados com AES-256-GCM** — nunca aparecem legíveis no repositório

## Fluxo do administrador

1. Abra **`admin.html`** (pode ser local; não indexado)
2. **Seção 1 — Catálogo:** importe listas M3U (URL ou arquivo) e/ou adicione canais manuais. O catálogo fica salvo **no seu navegador** — os links nunca vão para o GitHub
3. **Seção 2 — Usuário:** defina login, chave, marque os canais liberados e o tempo (♾️ ilimitado ou ⏳ minutos, contando da geração)
4. **Seção 4 — Publicar:** copie o `usuarios.js` gerado, cole no arquivo no GitHub e faça commit
5. **Renovar acesso:** gere o usuário de novo (mesma chave). **Revogar:** remova na seção 3 e publique

## Fluxo do usuário

1. Abra o app (ou instale pelo Chrome: "📲 Instalar app")
2. Entre com usuário + chave
3. Assista aos canais liberados; usuários com tempo veem a contagem regressiva no topo
4. Ao expirar: o app bloqueia automaticamente e volta para a tela de login

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | App com login, grade de canais e player |
| `admin.html` | Painel do administrador (catálogo + usuários + tempo) |
| `crypto.js` | AES-GCM + PBKDF2 (WebCrypto nativo, 150k iterações) |
| `usuarios.js` | Usuários/playlists **criptografados** (gerado pelo admin) |
| `vendor/hls.min.js` | Player HLS (hls.js v1.7.4, Apache-2.0) |
| `manifest.webmanifest` + `sw.js` + `icons/` | PWA e cache offline |

## Aviso legal

Este projeto é apenas um reprodutor de mídia e **não fornece, hospeda nem indexa conteúdo**. Use somente listas que você tem direito legal de acessar.
