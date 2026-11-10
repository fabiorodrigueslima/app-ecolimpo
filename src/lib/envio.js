// Envio das respostas (pesquisa e mensagens) para a cooperativa.
// O endereço e a chave pública do Supabase vêm das variáveis de ambiente
// (arquivo .env.local no computador; painel da Vercel quando publicar).
// Sem essas variáveis, o app fica em "modo de teste": confere a resposta,
// mas ela não sai do celular.

import { criarInsercao } from "./supabase.js";

const URL_SUPABASE = import.meta.env?.VITE_SUPABASE_URL ?? "";
const CHAVE_PUBLICA = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const ENVIO_LIGADO = Boolean(URL_SUPABASE && CHAVE_PUBLICA);

const inserir = ENVIO_LIGADO ? criarInsercao({ url: URL_SUPABASE, chave: CHAVE_PUBLICA }) : null;

export async function enviarResposta(resposta) {
  if (!inserir) return { ok: true, teste: true };
  return inserir("respostas", resposta);
}
