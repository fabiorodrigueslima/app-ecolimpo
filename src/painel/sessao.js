// Guarda o login da equipe e entrega sempre um token válido (renova sozinho).

import { precisaRenovar } from "./regras.js";
import { criarApiPainel, renovar } from "./api.js";

const CHAVE = "ecolimpo:painel-sessao";

function lerGuardada() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) ?? null;
  } catch {
    return null;
  }
}

let atual = lerGuardada();
let renovando = null;
let aoExpirar = () => {};

export function sessaoAtual() {
  return atual;
}

// guardar: false = só na memória (ex.: link do e-mail antes de criar a senha).
export function definirSessao(sessao, { guardar = true } = {}) {
  atual = sessao;
  if (!guardar) return;
  try {
    if (sessao) localStorage.setItem(CHAVE, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE);
  } catch {
    // sem armazenamento: o login vale só enquanto a página estiver aberta
  }
}

// O painel avisa aqui o que fazer quando a sessão termina.
export function quandoExpirar(funcao) {
  aoExpirar = funcao;
}

export async function obterToken() {
  if (!atual) return null;
  if (!precisaRenovar(atual)) return atual.token;
  renovando ??= renovar(atual).finally(() => {
    renovando = null;
  });
  const nova = await renovando;
  if (!nova) {
    definirSessao(null);
    aoExpirar();
    return null;
  }
  definirSessao({ ...nova, email: nova.email || atual?.email || "" });
  return nova.token;
}

export const apiPainel = criarApiPainel(obterToken);
