// Regras do envio diário do lembrete (usadas por api/lembrete.js).
// Usa a MESMA lista de condomínios e as MESMAS regras do app.

import { createHash, timingSafeEqual } from "node:crypto";
import { condominios as todosCondominios } from "../src/data/condominios.js";
import {
  coletasDoDia,
  condominiosComColetaNoDia,
  textoLembrete,
  textoLembretePoda,
  textoLembreteDosDois,
} from "../src/lib/coleta.js";
import { mensagemDoAviso } from "../src/lib/avisos.js";

// Só entregamos para serviços de notificação conhecidos (Google, Apple, Mozilla, Microsoft).
const SERVICOS_PUSH = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /(^|\.)push\.apple\.com$/,
  /\.notify\.windows\.com$/,
];

export function endpointConfiavel(endpoint) {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && SERVICOS_PUSH.some((r) => r.test(u.hostname));
  } catch {
    return false;
  }
}

// Confere a senha do "despertador" sem dar pistas pelo tempo de resposta.
export function pedidoAutorizado(cabecalho, segredo) {
  if (!segredo || typeof cabecalho !== "string") return false;
  const resumo = (t) => createHash("sha256").update(t).digest();
  return timingSafeEqual(resumo(cabecalho), resumo(`Bearer ${segredo}`));
}

// Resumo do envio -> linha da tabela envios_lembrete (SQL 008).
export function registroDoEnvio(resumo, erro = null) {
  if (erro || !resumo) {
    return {
      condominios: [],
      inscricoes: 0,
      enviados: 0,
      removidos: 0,
      falhas: 0,
      erro: String(erro?.message ?? "erro desconhecido").slice(0, 300),
    };
  }
  return {
    condominios: resumo.condominios,
    inscricoes: resumo.inscricoes,
    enviados: resumo.enviados,
    removidos: resumo.removidos,
    falhas: resumo.falhas,
    erro: null,
  };
}

// O texto muda conforme a coleta do dia: recicláveis, podas ou as duas.
export function mensagemDoLembrete(condominio, agora = new Date()) {
  const tipos = coletasDoDia(condominio, agora);
  const podas = tipos.includes("podas");
  const reciclaveis = tipos.includes("reciclaveis") || !podas;
  if (podas && reciclaveis) {
    return { titulo: "Hoje tem coleta seletiva e de podas", corpo: textoLembreteDosDois(condominio.horario), url: "/coleta", tag: "lembrete-coleta" };
  }
  if (podas) {
    return { titulo: "Hoje tem coleta de podas", corpo: textoLembretePoda(condominio.horario), url: "/coleta", tag: "lembrete-coleta" };
  }
  return { titulo: "Hoje tem coleta seletiva", corpo: textoLembrete(condominio.horario), url: "/coleta", tag: "lembrete-coleta" };
}

// Mensagens do dia por condomínio: o lembrete da coleta (se tiver coleta hoje)
// e os avisos da cooperativa marcados para hoje (só de condomínios ativos).
export function mensagensDoDia(condominios, avisos = [], agora = new Date()) {
  const porId = new Map();
  for (const c of condominiosComColetaNoDia(condominios, agora)) porId.set(c.id, [mensagemDoLembrete(c, agora)]);
  const ativos = new Set(condominios.map((c) => c.id));
  for (const aviso of avisos) {
    if (!ativos.has(aviso.condominio_id)) continue;
    porId.set(aviso.condominio_id, [...(porId.get(aviso.condominio_id) ?? []), mensagemDoAviso(aviso)]);
  }
  return porId;
}

// Envia o lembrete (e os avisos do dia) para quem ligou o lembrete.
// As funções de banco e de envio são passadas de fora (assim dá para testar).
export async function enviarLembretesDoDia({
  agora = new Date(),
  condominios = todosCondominios,
  avisos = [],
  buscarInscricoes,
  enviarPush,
  apagarInscricao,
  lote = 50,
}) {
  const porId = mensagensDoDia(condominios, avisos, agora);
  const resumo = { condominios: [...porId.keys()], inscricoes: 0, enviados: 0, removidos: 0, falhas: 0, ignorados: 0 };
  if (porId.size === 0) return resumo;

  const inscricoes = await buscarInscricoes([...porId.keys()]);
  resumo.inscricoes = inscricoes.length;

  async function enviarUma(inscricao) {
    const mensagens = porId.get(inscricao.condominio_id);
    if (!mensagens || !endpointConfiavel(inscricao.endpoint)) {
      resumo.ignorados++;
      return;
    }
    for (const mensagem of mensagens) {
      try {
        await enviarPush(
          { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
          JSON.stringify(mensagem),
        );
        resumo.enviados++;
      } catch (erro) {
        // 404/410 = o celular desligou as notificações ou desinstalou: apaga a inscrição.
        if (erro?.statusCode === 404 || erro?.statusCode === 410) {
          await apagarInscricao(inscricao.endpoint).catch(() => {});
          resumo.removidos++;
          return;
        }
        resumo.falhas++;
      }
    }
  }

  for (let i = 0; i < inscricoes.length; i += lote) {
    await Promise.all(inscricoes.slice(i, i + lote).map(enviarUma));
  }
  return resumo;
}
