// QR Code em SVG (nítido em qualquer tamanho de impressão).
// Nível de correção "M": o código ainda funciona com pequenos riscos ou sujeira no cartaz.

import QRCode from "qrcode";

// Matriz de quadradinhos: true = preto.
export function matrizQr(texto, correcao = "M") {
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: correcao });
  return { tamanho: modules.size, celulas: Array.from(modules.data, Boolean) };
}

// Um único "caminho" SVG com todos os quadradinhos pretos.
// margem = borda branca em quadradinhos (o padrão do QR pede 4).
export function svgDoQr(texto, { margem = 4, correcao = "M" } = {}) {
  const { tamanho, celulas } = matrizQr(texto, correcao);
  const total = tamanho + margem * 2;
  let caminho = "";
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (celulas[y * tamanho + x]) caminho += `M${x + margem} ${y + margem}h1v1h-1z`;
    }
  }
  return { total, caminho };
}
