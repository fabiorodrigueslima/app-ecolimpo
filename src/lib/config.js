// Configurações que vêm das variáveis de ambiente (arquivo .env.local no
// computador; painel da Vercel quando publicar). Nenhuma delas é secreta:
// tudo que começa com VITE_ vai junto com o app para o celular.

import { criarCliente } from "./supabase.js";

const env = import.meta.env ?? {};

export const URL_SUPABASE = env.VITE_SUPABASE_URL ?? "";
export const CHAVE_PUBLICA = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const VAPID_PUBLICA = env.VITE_VAPID_PUBLIC_KEY ?? "";
export const PRODUCAO = Boolean(env.PROD);

export const BANCO_LIGADO = Boolean(URL_SUPABASE && CHAVE_PUBLICA);
export const LEMBRETE_CONFIGURADO = BANCO_LIGADO && Boolean(VAPID_PUBLICA);

export const banco = BANCO_LIGADO ? criarCliente({ url: URL_SUPABASE, chave: CHAVE_PUBLICA }) : null;
