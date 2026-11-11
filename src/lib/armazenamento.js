// Guarda no próprio celular qual condomínio o morador escolheu.

const CHAVE = "ecolimpo:condominio";

export function lerCondominioSalvo() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

// Mês em que este celular respondeu a pesquisa (ex.: "2026-11").
const CHAVE_PESQUISA = "ecolimpo:pesquisa-mes";

export function lerMesDaPesquisa() {
  try {
    return localStorage.getItem(CHAVE_PESQUISA);
  } catch {
    return null;
  }
}

export function salvarMesDaPesquisa(mes) {
  try {
    localStorage.setItem(CHAVE_PESQUISA, mes);
  } catch {
    // sem armazenamento: segue sem guardar
  }
}

export function salvarCondominio(id) {
  try {
    if (id) localStorage.setItem(CHAVE, id);
    else localStorage.removeItem(CHAVE);
  } catch {
    // Navegador sem armazenamento (ex.: aba anônima): segue sem salvar.
  }
}
