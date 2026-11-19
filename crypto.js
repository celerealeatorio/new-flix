(function () {
  'use strict';

  var ITERACOES = 150000;

  function b64ParaBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesParaB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function derivarChave(senha, saltBytes, usos) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBytes, iterations: ITERACOES, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          false,
          usos || ['encrypt', 'decrypt']
        );
      });
  }

  window.IptvCrypto = {
    derivarParaSessao: function (entrada, senha) {
      return derivarChave(senha, b64ParaBytes(entrada.salt), ['decrypt']);
    },
    descriptografarComChave: function (entrada, chave) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ParaBytes(entrada.iv) }, chave, b64ParaBytes(entrada.dados))
        .then(function (plain) { return new TextDecoder().decode(plain); });
    },
    criptografar: function (texto, senha) {
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var dados = new TextEncoder().encode(texto);
      return derivarChave(senha, salt).then(function (chave) {
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, chave, dados);
      }).then(function (cript) {
        return {
          salt: bytesParaB64(salt),
          iv: bytesParaB64(iv),
          dados: bytesParaB64(new Uint8Array(cript))
        };
      });
    },

    descriptografar: function (entrada, senha) {
      var salt = b64ParaBytes(entrada.salt);
      var iv = b64ParaBytes(entrada.iv);
      var dados = b64ParaBytes(entrada.dados);
      return derivarChave(senha, salt).then(function (chave) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, chave, dados);
      }).then(function (plain) {
        return new TextDecoder().decode(plain);
      });
    }
  };
})();
