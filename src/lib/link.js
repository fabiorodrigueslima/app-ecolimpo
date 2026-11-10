// Endereço do app e link de cada condomínio (usado no QR Code do cartaz).
// O endereço pode ser trocado pela variável VITE_APP_URL.

export const URL_APP_PADRAO = "https://app.cooperaecolimpo.com.br";
export const URL_APP = (import.meta.env?.VITE_APP_URL || URL_APP_PADRAO).replace(/\/+$/, "");

// Link que vai no QR Code: abre o app com o condomínio já marcado.
export function linkDoCondominio(id, base = URL_APP) {
  return `${base}/?c=${encodeURIComponent(id)}`;
}

// Lê o condomínio do link (?c=...). Só aceita condomínio que existe na lista.
export function lerCondominioDoLink(busca, idsValidos) {
  const id = new URLSearchParams(busca ?? "").get("c");
  return id && idsValidos.includes(id) ? id : null;
}

// Endereço curto para escrever no cartaz (sem https://).
export function enderecoCurto(base = URL_APP) {
  return base.replace(/^https?:\/\//, "");
}
