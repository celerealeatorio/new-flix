# 📺 IPTV Player (PWA com controle de acesso)

Player de IPTV para Android/PC com **login por usuário** e **links de playlist criptografados** — quem acessar o repositório **não consegue ver as URLs das listas**.

## Como funciona a segurança

- As playlists de cada usuário são **criptografadas com AES-256-GCM** (chave derivada da senha do usuário via PBKDF2, 150.000 iterações)
- O arquivo `usuarios.js` no repositório contém **apenas dados criptografados** — sem a chave de acesso, é impossível recuperar os links
- Cada pessoa entra com **usuário + chave**; sem credenciais válidas, o app não carrega nada
- Usuários marcados como **admin** podem carregar listas próprias; usuários comuns só veem as listas liberadas

> ⚠️ **Limite honesto:** como o app é 100% estático (GitHub Pages), a proteção é contra curiosos — alguém com conhecimento técnico e a chave pode ver as URLs no tráfego de rede ao reproduzir. Para proteção forte contra isso, o ideal é um proxy com backend (ex.: Cloudflare Worker).

## Para o administrador

1. Abra **`admin.html`** (pode abrir localmente, sem publicar para os usuários)
2. Preencha **usuário**, **chave** e as **playlists** (nome + URL M3U/M3U8)
3. Marque "administrador" se a pessoa deve poder carregar listas próprias
4. Clique em **🔐 Gerar entrada** → copie o conteúdo e substitua o arquivo **`usuarios.js`** no repositório
5. Faça commit/push — pronto, o usuário já pode entrar

**Revogar acesso:** gere o `usuarios.js` novamente sem aquela entrada e faça push.

## Para os usuários

1. Abra o app (link do GitHub Pages) ou instale pelo Chrome ("📲 Instalar app")
2. Entre com o **usuário** e a **chave** que você recebeu
3. Use as abas **Todos / ⭐ Favoritos / 🕐 Recentes**, busque canais e assista

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | App com tela de login e player |
| `admin.html` | Painel do administrador (gera usuários criptografados) |
| `crypto.js` | Criptografia AES-GCM + PBKDF2 (WebCrypto nativo) |
| `usuarios.js` | Usuários e playlists **criptografados** (edite via admin.html) |
| `vendor/hls.min.js` | Player HLS (hls.js v1.7.4, Apache-2.0) |
| `manifest.webmanifest` + `sw.js` + `icons/` | Instalação como app (PWA) e cache offline |

## Aviso legal

Este projeto é apenas um reprodutor de mídia e **não fornece, hospeda nem indexa conteúdo**. Use somente listas que você tem direito legal de acessar.
