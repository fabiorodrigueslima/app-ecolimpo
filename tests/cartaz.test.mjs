import { test } from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";

import { matrizQr, svgDoQr } from "../src/lib/qr.js";
import { linkDoCondominio, lerCondominioDoLink, enderecoCurto, URL_APP } from "../src/lib/link.js";

// "Fotografa" a matriz do QR (como a câmera do celular) e tenta ler.
function lerQr(texto) {
  const { tamanho, celulas } = matrizQr(texto);
  const escala = 8;
  const margem = 4;
  const lado = (tamanho + margem * 2) * escala;
  const pixels = new Uint8ClampedArray(lado * lado * 4).fill(255);
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (!celulas[y * tamanho + x]) continue;
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const i = (((y + margem) * escala + dy) * lado + (x + margem) * escala + dx) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(pixels, lado, lado)?.data ?? null;
}

test("endereço oficial do app", () => {
  assert.equal(URL_APP, "https://app.cooperaecolimpo.com.br");
  assert.equal(enderecoCurto(), "app.cooperaecolimpo.com.br");
});

test("link do condomínio no QR Code", () => {
  assert.equal(linkDoCondominio("jardins-do-lago"), "https://app.cooperaecolimpo.com.br/?c=jardins-do-lago");
  assert.equal(linkDoCondominio("a", "http://localhost:4174"), "http://localhost:4174/?c=a");
});

test("app só aceita condomínio do link se ele existe", () => {
  assert.equal(lerCondominioDoLink("?c=jardins", ["jardins", "lago"]), "jardins");
  assert.equal(lerCondominioDoLink("?c=outro", ["jardins"]), null);
  assert.equal(lerCondominioDoLink("", ["jardins"]), null);
  assert.equal(lerCondominioDoLink("?c=", ["jardins"]), null);
});

test("QR Code gerado é lido pela câmera e leva ao link certo", () => {
  for (const id of ["exemplo-manha", "condominio-jardins-do-lago-ii"]) {
    const link = linkDoCondominio(id);
    assert.equal(lerQr(link), link);
  }
});

test("desenho SVG do QR tem a borda branca e os quadradinhos", () => {
  const { total, caminho } = svgDoQr("https://app.cooperaecolimpo.com.br/?c=a");
  const { tamanho } = matrizQr("https://app.cooperaecolimpo.com.br/?c=a");
  assert.equal(total, tamanho + 8);
  assert.match(caminho, /^M4 4h1v1h-1z/); // canto de cima começa preto, depois da borda
});
