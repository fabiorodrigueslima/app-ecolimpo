// Conversa do painel com o Supabase: login e dados (sempre com o login da equipe).

import { requisitar } from "../lib/supabase.js";
import { URL_SUPABASE, CHAVE_PUBLICA } from "../lib/config.js";
import { sessaoDaResposta, mensagemDeErroDoLogin, montarFiltroRespostas, linhaDoCondominio } from "./regras.js";

const base = (token) => ({ url: URL_SUPABASE, chave: CHAVE_PUBLICA, token });

// ---------- Login ----------

export async function entrar(email, senha) {
  const r = await requisitar(base(), "POST", "auth/v1/token?grant_type=password", {
    corpo: { email: email.trim().toLowerCase(), password: senha },
  });
  return r.ok ? { ok: true, sessao: sessaoDaResposta(r.dados) } : { ok: false, erro: mensagemDeErroDoLogin(r.status, r.dados) };
}

export async function renovar(sessao) {
  const r = await requisitar(base(), "POST", "auth/v1/token?grant_type=refresh_token", {
    corpo: { refresh_token: sessao.renovacao },
  });
  return r.ok ? sessaoDaResposta(r.dados) : null;
}

export async function sair(token) {
  await requisitar(base(token), "POST", "auth/v1/logout");
}

export async function pedirNovaSenha(email) {
  const volta = encodeURIComponent(`${window.location.origin}/painel`);
  const r = await requisitar(base(), "POST", `auth/v1/recover?redirect_to=${volta}`, {
    corpo: { email: email.trim().toLowerCase() },
  });
  return r.ok || r.status === 429 ? { ok: r.ok, status: r.status } : { ok: false, status: r.status };
}

export async function definirSenha(token, senha) {
  const r = await requisitar(base(token), "PUT", "auth/v1/user", { corpo: { password: senha } });
  return r.ok ? { ok: true } : { ok: false, erro: mensagemDeErroDoLogin(r.status, r.dados) };
}

export async function lerEmail(token) {
  const r = await requisitar(base(token), "GET", "auth/v1/user");
  return r.ok ? r.dados?.email ?? "" : "";
}

// ---------- Dados (precisam de obterToken: devolve um token válido) ----------

export function criarApiPainel(obterToken) {
  async function pedir(metodo, caminho, opcoes) {
    const token = await obterToken();
    if (!token) return { ok: false, status: 401, dados: null };
    return requisitar(base(token), metodo, `rest/v1/${caminho}`, opcoes);
  }

  return {
    // true = é da equipe; false = não é; null = sem conexão / erro.
    async ehEquipe() {
      const r = await pedir("POST", "rpc/eh_equipe", { corpo: {} });
      if (r.ok) return r.dados === true;
      return r.status === 401 || r.status === 403 ? false : null;
    },

    listarRespostas(filtros, { limite = 50, deslocamento = 0, campos = "*" } = {}) {
      const partes = [
        `select=${campos}`,
        ...montarFiltroRespostas(filtros),
        "order=criado_em.desc",
        `limit=${limite}`,
        `offset=${deslocamento}`,
      ];
      return pedir("GET", `respostas?${partes.join("&")}`);
    },

    marcarLida(id, lida) {
      return pedir("PATCH", `respostas?id=eq.${encodeURIComponent(id)}`, { corpo: { lida }, prefer: "return=minimal" });
    },

    apagarResposta(id) {
      return pedir("DELETE", `respostas?id=eq.${encodeURIComponent(id)}`, { prefer: "return=minimal" });
    },

    listarCondominios() {
      return pedir("GET", "condominios?select=*&order=nome");
    },

    criarCondominio(id, dados) {
      return pedir("POST", "condominios", { corpo: { id, ...linhaDoCondominio(dados) }, prefer: "return=minimal" });
    },

    editarCondominio(id, dados) {
      return pedir("PATCH", `condominios?id=eq.${encodeURIComponent(id)}`, {
        corpo: { ...linhaDoCondominio(dados), atualizado_em: new Date().toISOString() },
        prefer: "return=minimal",
      });
    },

    contarInscricoes() {
      return pedir("POST", "rpc/contar_inscricoes", { corpo: {} });
    },
  };
}
