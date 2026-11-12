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

// ---------- Verificação em 2 etapas (Supabase MFA, tipo TOTP) ----------

// Lista os autenticadores cadastrados da pessoa logada.
export async function lerFatores(token) {
  const r = await requisitar(base(token), "GET", "auth/v1/user");
  return r.ok ? { ok: true, fatores: r.dados?.factors ?? [] } : { ok: false, fatores: [] };
}

// Primeira vez: cria o autenticador e devolve o QR Code e a chave para digitar.
export async function cadastrarAutenticador(token) {
  const r = await requisitar(base(token), "POST", "auth/v1/factors", {
    corpo: { factor_type: "totp", issuer: "Ecolimpo Painel" },
  });
  if (!r.ok) return { ok: false };
  return { ok: true, id: r.dados.id, qr: r.dados.totp?.qr_code, chave: r.dados.totp?.secret };
}

// Confere o código de 6 números. Se estiver certo, devolve um login novo (com as 2 etapas).
export async function confirmarCodigo(token, fatorId, codigo) {
  const desafio = await requisitar(base(token), "POST", `auth/v1/factors/${encodeURIComponent(fatorId)}/challenge`, {
    corpo: {},
  });
  if (!desafio.ok) return { ok: false, erro: "Não foi possível conferir agora. Tente de novo." };
  const r = await requisitar(base(token), "POST", `auth/v1/factors/${encodeURIComponent(fatorId)}/verify`, {
    corpo: { challenge_id: desafio.dados.id, code: String(codigo).trim() },
  });
  if (r.ok) return { ok: true, sessao: sessaoDaResposta(r.dados) };
  if (r.status === 429) return { ok: false, erro: "Muitas tentativas. Espere alguns minutos." };
  return { ok: false, erro: "Código incorreto ou vencido. Confira o app autenticador e digite o código atual." };
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

    // Avisos de hoje em diante (aba Avisos).
    listarAvisos(desde) {
      return pedir("GET", `avisos?select=*&data=gte.${encodeURIComponent(desde)}&order=data.asc,id.asc`);
    },

    criarAviso(linha) {
      return pedir("POST", "avisos", { corpo: linha, prefer: "return=minimal" });
    },

    apagarAviso(id) {
      return pedir("DELETE", `avisos?id=eq.${encodeURIComponent(id)}`, { prefer: "return=minimal" });
    },

    contarInscricoes() {
      return pedir("POST", "rpc/contar_inscricoes", { corpo: {} });
    },

    ultimoEnvioLembrete() {
      return pedir("GET", "envios_lembrete?select=*&order=executado_em.desc&limit=1");
    },

    // Todas as respostas, de 1000 em 1000 (para a cópia de segurança).
    async todasAsRespostas() {
      const lista = [];
      for (let pagina = 0; ; pagina++) {
        const r = await pedir("GET", `respostas?select=*&order=criado_em.asc&limit=1000&offset=${pagina * 1000}`);
        if (!r.ok) return r;
        lista.push(...r.dados);
        if (r.dados.length < 1000) return { ok: true, dados: lista };
      }
    },
  };
}
