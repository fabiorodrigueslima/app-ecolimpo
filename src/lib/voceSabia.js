// Regras do quadro "Você sabia?" (testadas em tests/voceSabia.test.mjs).

// 8.7 -> "8,7%"; 69 -> "69%"
export function formatarPorcentagem(valor) {
  return `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

// Ordena do que mais recicla para o que menos recicla.
export function ordenarPaises(paises) {
  return [...paises].sort((a, b) => b.porcentagem - a.porcentagem);
}

// Frases do topo do quadro, montadas a partir dos números (nada escrito à mão).
export function frasesDoQuadro(paises) {
  const brasil = paises.find((p) => p.destaque);
  const lider = ordenarPaises(paises).find((p) => !p.destaque);
  if (!brasil || !lider) return null;
  return {
    titulo: `O Brasil recicla só ${formatarPorcentagem(brasil.porcentagem)} do lixo das cidades.`,
    comparacao: `Na ${lider.nome}, chega a ${formatarPorcentagem(lider.porcentagem)}.`,
  };
}

// Fontes sem repetição, na ordem em que aparecem.
export function fontesUnicas(paises) {
  const vistas = new Map();
  for (const p of paises) {
    if (!vistas.has(p.link)) vistas.set(p.link, { fonte: p.fonte, link: p.link, anos: new Set() });
    vistas.get(p.link).anos.add(p.ano);
  }
  return [...vistas.values()].map((f) => ({ ...f, anos: [...f.anos].sort().join(" e ") }));
}

export function depoimentoPreenchido(depoimento) {
  return Boolean(depoimento?.texto) && !/A PREENCHER/.test(depoimento.texto);
}
