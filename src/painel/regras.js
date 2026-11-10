// Regras do painel (sem tela), testadas em tests/painel.test.mjs.

import { normalizar } from "../lib/busca.js";
import { HORARIOS_VALIDOS } from "../lib/coleta.js";
import { TIPOS_MENSAGEM, TEMAS_PESQUISA } from "../lib/formularios.js";

export const ROTULO_TIPO = {
  pesquisa: "Pesquisa",
  ...Object.fromEntries(TIPOS_MENSAGEM.map((t) => [t.id, t.rotulo])),
};

// ---------- Login ----------

// Resposta do login do Supabase -> sessão guardada no navegador.
export function sessaoDaResposta(dados, agoraSeg = Math.floor(Date.now() / 1000)) {
  return {
    token: dados.access_token,
    renovacao: dados.refresh_token,
    expiraEm: Number(dados.expires_at) || agoraSeg + Number(dados.expires_in || 3600),
    email: dados.user?.email ?? dados.email ?? "",
  };
}

// Renova 1 minuto antes de vencer.
export function precisaRenovar(sessao, agoraSeg = Math.floor(Date.now() / 1000)) {
  return !sessao?.expiraEm || sessao.expiraEm - 60 <= agoraSeg;
}

// Link do e-mail ("esqueci a senha" ou convite) chega com os dados no fim do endereço (#...).
export function lerRetornoDoEmail(hash) {
  const p = new URLSearchParams(String(hash ?? "").replace(/^#/, ""));
  if (p.get("error")) return { erro: p.get("error_description") || "O link do e-mail não funcionou." };
  const tipo = p.get("type");
  if (!p.get("access_token") || !["recovery", "invite", "signup", "magiclink"].includes(tipo)) return null;
  return {
    tipo,
    sessao: sessaoDaResposta({
      access_token: p.get("access_token"),
      refresh_token: p.get("refresh_token"),
      expires_at: p.get("expires_at"),
      expires_in: p.get("expires_in"),
    }),
  };
}

export function mensagemDeErroDoLogin(status, dados) {
  if (status === 0) return "Sem conexão. Confira a internet e tente de novo.";
  if (status === 429) return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if (status === 400 || status === 401) {
    const codigo = dados?.error_code ?? dados?.error ?? "";
    if (/weak_password/.test(codigo)) return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
    if (/same_password/.test(codigo)) return "A nova senha precisa ser diferente da anterior.";
    return "E-mail ou senha incorretos.";
  }
  return "Não foi possível entrar agora. Tente de novo em instantes.";
}

export function validarNovaSenha(senha, confirmacao) {
  if (String(senha).length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) return "Misture letras e números na senha.";
  if (senha !== confirmacao) return "As duas senhas não são iguais.";
  return "";
}

// ---------- Respostas ----------

// Filtros da tela -> pedaços do endereço da consulta (PostgREST).
export function montarFiltroRespostas(filtros, agora = new Date()) {
  const partes = [];
  if (filtros.tipo === "mensagens") partes.push("tipo=neq.pesquisa");
  else if (filtros.tipo && filtros.tipo !== "todas") partes.push(`tipo=eq.${encodeURIComponent(filtros.tipo)}`);
  if (filtros.condominio) partes.push(`condominio_id=eq.${encodeURIComponent(filtros.condominio)}`);
  if (filtros.periodo && filtros.periodo !== "tudo") {
    const desde = new Date(agora.getTime() - Number(filtros.periodo) * 86400000);
    partes.push(`criado_em=gte.${encodeURIComponent(desde.toISOString())}`);
  }
  if (filtros.soNaoLidas) partes.push("lida=is.false");
  return partes;
}

// Média das notas das pesquisas (1 casa decimal).
export function resumoNotas(respostas) {
  const pesquisas = respostas.filter((r) => r.tipo === "pesquisa");
  const medias = {};
  for (const tema of TEMAS_PESQUISA) {
    const notas = pesquisas.map((r) => r[`nota_${tema.id}`]).filter((n) => Number.isFinite(n));
    medias[tema.id] = notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null;
  }
  return { total: respostas.length, pesquisas: pesquisas.length, medias };
}

export function formatarDataHora(iso) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Planilha CSV (abre no Excel em português: separador ";" e BOM).
export function paraCsv(respostas, nomes = {}) {
  const colunas = [
    ["Data", (r) => formatarDataHora(r.criado_em)],
    ["Condomínio", (r) => nomes[r.condominio_id] ?? r.condominio_id],
    ["Tipo", (r) => ROTULO_TIPO[r.tipo] ?? r.tipo],
    ["Nota coleta", (r) => r.nota_coleta ?? ""],
    ["Nota mobilização", (r) => r.nota_mobilizacao ?? ""],
    ["Nota atendimento", (r) => r.nota_atendimento ?? ""],
    ["Texto", (r) => r.texto ?? ""],
    ["Nome", (r) => r.nome ?? ""],
    ["Apartamento", (r) => r.apartamento ?? ""],
    ["Lida", (r) => (r.lida ? "sim" : "não")],
  ];
  const celula = (v) => {
    let t = String(v);
    if (/^[=+\-@]/.test(t)) t = `'${t}`; // impede fórmulas maliciosas no Excel
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const linhas = [colunas.map(([n]) => n), ...respostas.map((r) => colunas.map(([, f]) => f(r)))];
  return "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
}

// ---------- Condomínios ----------

export function gerarId(nome, existentes = []) {
  const base =
    normalizar(nome)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "condominio";
  let id = base;
  for (let n = 2; existentes.includes(id); n++) id = `${base}-${n}`;
  return id;
}

export function validarCondominio(dados) {
  const erros = {};
  const nome = String(dados.nome ?? "").trim();
  if (nome.length < 2) erros.nome = "Escreva o nome do condomínio.";
  else if (nome.length > 100) erros.nome = "O nome pode ter até 100 letras.";
  if (String(dados.regiao ?? "").trim().length > 100) erros.regiao = "A região pode ter até 100 letras.";
  if (!Array.isArray(dados.dias) || dados.dias.length === 0) erros.dias = "Marque pelo menos um dia da coleta.";
  else if (dados.dias.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) erros.dias = "Dia inválido.";
  if (!HORARIOS_VALIDOS.includes(dados.horario)) erros.horario = "Escolha 9h ou 14h.";
  return { ok: Object.keys(erros).length === 0, erros };
}

// Dados da tela -> linha do banco.
export function linhaDoCondominio(dados) {
  return {
    nome: dados.nome.trim(),
    regiao: dados.regiao?.trim() || null,
    dias: [...new Set(dados.dias)].sort((a, b) => a - b),
    horario: dados.horario,
    piloto: Boolean(dados.piloto),
    ativo: Boolean(dados.ativo),
  };
}
