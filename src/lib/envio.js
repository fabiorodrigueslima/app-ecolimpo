// Envio das respostas (pesquisa e mensagens) e da inscrição do lembrete.
//   * Com o anti-robô ligado: vai para o nosso servidor (api/enviar.js), que
//     confere com a Cloudflare e só então grava no banco.
//   * Sem banco (modo de teste): confere a resposta, mas ela não sai do celular.

import { banco, BANCO_LIGADO, VERIFICACAO_LIGADA } from "./config.js";

export const ENVIO_LIGADO = BANCO_LIGADO;

// Manda para api/enviar.js. Devolve { ok } ou { ok: false, limite, robo }.
export async function enviarPeloServidor(acao, dados, token, buscar = globalThis.fetch) {
  try {
    const r = await buscar("/api/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao, dados, token }),
    });
    const corpo = await r.json().catch(() => ({}));
    if (r.ok && corpo.ok) return { ok: true };
    return { ok: false, status: r.status, limite: corpo.motivo === "limite", robo: corpo.motivo === "robo" };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function enviarResposta(resposta, token) {
  if (!banco) return { ok: true, teste: true };
  if (VERIFICACAO_LIGADA) return enviarPeloServidor("resposta", resposta, token);
  return banco.inserir("respostas", resposta);
}
