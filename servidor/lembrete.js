// Regras do envio diário do lembrete (usadas por api/lembrete.js).
// Usa a MESMA lista de condomínios e as MESMAS regras do app.

import { createHash, timingSafeEqual } from "node:crypto";
import { condominios as todosCondominios } from "../src/data/condominios.js";
import { condominiosComColetaNoDia, textoLembrete } from "../src/lib/coleta.js";

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

export function mensagemDoLembrete(condominio) {
  return {
    titulo: "Hoje tem coleta seletiva",
    corpo: textoLembrete(condominio.horario),
    url: "/coleta",
  };
}

// Envia o lembrete para quem mora em condomínio com coleta hoje.
// As funções de banco e de envio são passadas de fora (assim dá para testar).
export async function enviarLembretesDoDia({
  agora = new Date(),
  condominios = todosCondominios,
  buscarInscricoes,
  enviarPush,
  apagarInscricao,
  lote = 50,
}) {
  const doDia = condominiosComColetaNoDia(condominios, agora);
  const resumo = { condominios: doDia.map((c) => c.id), inscricoes: 0, enviados: 0, removidos: 0, falhas: 0, ignorados: 0 };
  if (doDia.length === 0) return resumo;

  const porId = new Map(doDia.map((c) => [c.id, c]));
  const inscricoes = await buscarInscricoes([...porId.keys()]);
  resumo.inscricoes = inscricoes.length;

  async function enviarUma(inscricao) {
    const condominio = porId.get(inscricao.condominio_id);
    if (!condominio || !endpointConfiavel(inscricao.endpoint)) {
      resumo.ignorados++;
      return;
    }
    try {
      await enviarPush(
        { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
        JSON.stringify(mensagemDoLembrete(condominio)),
      );
      resumo.enviados++;
    } catch (erro) {
      // 404/410 = o celular desligou as notificações ou desinstalou: apaga a inscrição.
      if (erro?.statusCode === 404 || erro?.statusCode === 410) {
        await apagarInscricao(inscricao.endpoint).catch(() => {});
        resumo.removidos++;
      } else {
        resumo.falhas++;
      }
    }
  }

  for (let i = 0; i < inscricoes.length; i += lote) {
    await Promise.all(inscricoes.slice(i, i + lote).map(enviarUma));
  }
  return resumo;
}
