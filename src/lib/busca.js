// Busca que ignora acentos e maiúsculas (usada na escolha do condomínio e no painel).

export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
