(function () {
  function bancoSessao() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('newflix-sessao', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('sessao'); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      req.onblocked = function () { reject(new Error('Armazenamento bloqueado')); };
    });
  }
  function sessaoDB(acao, valor) {
    return bancoSessao().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('sessao', acao === 'get' ? 'readonly' : 'readwrite');
        var store = tx.objectStore('sessao');
        var req = acao === 'get' ? store.get('atual') : acao === 'put' ? store.put(valor, 'atual') : store.delete('atual');
        tx.oncomplete = function () { db.close(); resolve(req.result); };
        tx.onerror = tx.onabort = function () { db.close(); reject(tx.error || new Error('Armazenamento indisponível')); };
      });
    });
  }
  function renderGrid(soFavoritos, canais, favoritos, canalAtual, esc) {
    var grid = document.getElementById('chGrid');
    var busca = document.getElementById('busca').value.toLowerCase().trim();

    var base = soFavoritos
      ? canais.filter(function (c) { return favoritos.indexOf(c.url) !== -1; })
      : canais;

    var filtrados = base.filter(function (c) {
      if (busca && c.nome.toLowerCase().indexOf(busca) === -1) return false;
      return true;
    });

    if (!filtrados.length) {
      var msg = soFavoritos ? 'Nenhum favorito ainda — toque na ⭐ de um canal.' : 'Nenhum canal encontrado.';
      grid.innerHTML = '<div class="empty-list">' + msg + '</div>';
      return;
    }

    grid.innerHTML = filtrados.map(function (c) {
      var fav = favoritos.indexOf(c.url) !== -1;
      var ativo = canalAtual && canalAtual.url === c.url;
      var thumb = c.logo
        ? '<img src="' + esc(c.logo) + '" alt="" loading="lazy" onerror="this.innerHTML=\'<span class=\\\'no-logo\\\'>📺</span>\'">'
        : '<span class="no-logo">📺</span>';
      return '<div class="ch-card' + (ativo ? ' active' : '') + '" data-url="' + esc(c.url) + '">' +
        '<button class="fav' + (fav ? ' on' : '') + '" data-fav="1" title="Favoritar">' + (fav ? '★' : '☆') + '</button>' +
        '<div class="thumb">' + thumb + '</div>' +
        '<div class="txt"><div class="name">' + esc(c.nome) + '</div>' +
        '<div class="group">' + esc(c.grupo) + '</div></div>' +
        '</div>';
    }).join('');
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtTempo(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
    var txt = (h > 0 ? h + 'h ' : '') + (h > 0 || m > 0 ? m + 'min ' : '') + (h > 0 ? '' : seg + 's');
    return txt.trim();
  }


  function isYouTube(url) { return /^yt:/i.test(url); }
  function ytEmbed(url) {
    var ch = url.replace(/^yt:/i, '');
    return 'https://www.youtube.com/embed/live_stream?channel=' + encodeURIComponent(ch) + '&autoplay=1';
  }


window.NewflixSessao = sessaoDB;
window.NewflixRender = renderGrid;
window.NewflixHelpers = { esc: esc, fmtTempo: fmtTempo, isYouTube: isYouTube, ytEmbed: ytEmbed };
})();
