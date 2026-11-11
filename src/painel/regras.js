// Regras do painel (sem tela), testadas em tests/painel.test.mjs.

import { normalizar } from "../lib/busca.js";
import { HORARIOS_VALIDOS } from "../lib/coleta.js";
import { TIPOS_MENSAGEM, TEMAS_PESQUISA } from "../lib/formularios.js";
import { HABITOS } from "../data/pesquisa.js";

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

const umaCasa = (n) => Math.round(n * 10) / 10;
const porcento = (parte, total) => (total ? Math.round((parte / total) * 100) : null);

// "coleta:nao_passou" -> "Coleta seletiva: Não passou no dia"
export function rotuloMotivo(codigo) {
  const [idTema, idMotivo] = String(codigo).split(":");
  const tema = TEMAS_PESQUISA.find((t) => t.id === idTema);
  const motivo = tema?.motivos.find((m) => m.id === idMotivo);
  return tema && motivo ? `${tema.rotulo}: ${motivo.rotulo}` : codigo;
}

export const rotuloHabito = (id) => HABITOS.find((h) => h.id === id)?.rotulo ?? "";

// Resumo das pesquisas (padrão de mercado):
//   * satisfeitos = % de notas 4 ou 5 entre quem respondeu o tema ("Não sei" fica de fora)
//   * NPS = % que dá 9–10 menos % que dá 0–6 (vai de -100 a +100)
export function resumoNotas(respostas) {
  const pesquisas = respostas.filter((r) => r.tipo === "pesquisa");
  const medias = {};
  const temas = {};
  for (const tema of TEMAS_PESQUISA) {
    const notas = pesquisas.map((r) => r[`nota_${tema.id}`]).filter((n) => Number.isFinite(n));
    medias[tema.id] = notas.length ? umaCasa(notas.reduce((a, b) => a + b, 0) / notas.length) : null;
    temas[tema.id] = {
      respostas: notas.length,
      satisfeitos: porcento(notas.filter((n) => n >= 4).length, notas.length),
    };
  }

  const notasNps = pesquisas.map((r) => r.nps).filter((n) => Number.isFinite(n));
  const promotores = notasNps.filter((n) => n >= 9).length;
  const detratores = notasNps.filter((n) => n <= 6).length;
  const nps = {
    respostas: notasNps.length,
    valor: notasNps.length ? Math.round(((promotores - detratores) / notasNps.length) * 100) : null,
    promotores: porcento(promotores, notasNps.length),
    neutros: porcento(notasNps.length - promotores - detratores, notasNps.length),
    detratores: porcento(detratores, notasNps.length),
  };

  const contagem = new Map();
  for (const r of pesquisas) for (const m of r.motivos ?? []) contagem.set(m, (contagem.get(m) ?? 0) + 1);
  const motivos = [...contagem.entries()]
    .map(([codigo, total]) => ({ codigo, rotulo: rotuloMotivo(codigo), total }))
    .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, "pt-BR"));

  const comHabito = pesquisas.filter((r) => HABITOS.some((h) => h.id === r.habito));
  const habito = {
    respostas: comHabito.length,
    ...Object.fromEntries(HABITOS.map((h) => [h.id, porcento(comHabito.filter((r) => r.habito === h.id).length, comHabito.length)])),
  };

  return { total: respostas.length, pesquisas: pesquisas.length, medias, temas, nps, motivos, habito };
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
    ["Recomendação (0-10)", (r) => r.nps ?? ""],
    ["Separa em casa", (r) => rotuloHabito(r.habito)],
    ["Motivos (nota baixa)", (r) => (r.motivos ?? []).map(rotuloMotivo).join(" | ")],
    ["O que aconteceu", (r) => Object.values(r.detalhes ?? {}).join(" | ")],
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

// ---------- Lembrete das 6h30 (registro do despertador) ----------

// Situação mostrada no painel a partir do último registro (tabela envios_lembrete).
// "ok": rodou nas últimas 26 horas sem erro. "atencao": atrasou ou deu erro. "nunca": ainda não rodou.
export function situacaoLembrete(ultimo, agora = new Date()) {
  if (!ultimo) return { nivel: "nunca", titulo: "O lembrete ainda não foi enviado nenhuma vez", detalhe: "Ele começa a funcionar depois que o app for publicado." };
  const quando = formatarDataHora(ultimo.executado_em);
  const horas = (agora.getTime() - new Date(ultimo.executado_em).getTime()) / 3600000;
  if (ultimo.erro) {
    return { nivel: "atencao", titulo: `O último lembrete deu erro (${quando})`, detalhe: "Os moradores podem não ter recebido o aviso. Avise quem cuida do app." };
  }
  if (horas > 26) {
    return { nivel: "atencao", titulo: `O lembrete não roda desde ${quando}`, detalhe: "O despertador das 6h30 pode estar parado. Avise quem cuida do app." };
  }
  const n = ultimo.condominios?.length ?? 0;
  const detalhe =
    n === 0
      ? "Hoje nenhum condomínio tinha coleta, então nenhum aviso foi enviado."
      : `${n} condomínio(s) com coleta · ${ultimo.enviados} aviso(s) enviado(s)` +
        (ultimo.falhas ? ` · ${ultimo.falhas} falha(s)` : "") +
        (ultimo.removidos ? ` · ${ultimo.removidos} celular(es) que desligaram o aviso` : "");
  return { nivel: ultimo.falhas ? "atencao" : "ok", titulo: `Último lembrete: ${quando}`, detalhe };
}

// ---------- Cópia de segurança ----------

export const DIAS_PARA_NOVA_COPIA = 30;

export function montarBackup({ respostas, condominios, geradoEm = new Date() }) {
  return {
    app: "Ecolimpo — Coleta Seletiva",
    tipo: "copia-de-seguranca",
    versao: 1,
    gerado_em: geradoEm.toISOString(),
    totais: { respostas: respostas.length, condominios: condominios.length },
    condominios,
    respostas,
  };
}

// Quantos dias desde a última cópia (null = nunca baixou neste computador).
export function diasDesdeCopia(isoUltima, agora = new Date()) {
  if (!isoUltima) return null;
  return Math.floor((agora.getTime() - new Date(isoUltima).getTime()) / 86400000);
}
