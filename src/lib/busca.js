// Busca do "Recicla ou não recicla?": ignora acentos e maiúsculas.

export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function buscarMateriais(lista, termo) {
  const ordenada = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return ordenada;

  const busca = normalizar(termo);
  return ordenada
    .filter((m) => {
      const texto = normalizar([m.nome, ...(m.outros ?? []), m.categoria].join(" "));
      return palavras.every((p) => texto.includes(p));
    })
    .sort((a, b) => Number(normalizar(b.nome).startsWith(busca)) - Number(normalizar(a.nome).startsWith(busca)));
}

export const RESPOSTAS = {
  sim: { rotulo: "Recicla", classe: "sim" },
  nao: { rotulo: "Não recicla", classe: "nao" },
  depende: { rotulo: "Depende", classe: "depende" },
};
