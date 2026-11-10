// Guarda no próprio celular qual condomínio o morador escolheu.

const CHAVE = "ecolimpo:condominio";

export function lerCondominioSalvo() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
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
