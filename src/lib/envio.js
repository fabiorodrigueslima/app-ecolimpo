// Envio das respostas (pesquisa e mensagens) para a cooperativa.
// Sem as variáveis do Supabase (veja src/lib/config.js), o app fica em
// "modo de teste": confere a resposta, mas ela não sai do celular.

import { banco, BANCO_LIGADO } from "./config.js";

export const ENVIO_LIGADO = BANCO_LIGADO;

export async function enviarResposta(resposta) {
  if (!banco) return { ok: true, teste: true };
  return banco.inserir("respostas", resposta);
}
