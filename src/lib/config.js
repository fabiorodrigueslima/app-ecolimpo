// Configurações que vêm das variáveis de ambiente (arquivo .env.local no
// computador; painel da Vercel quando publicar). Nenhuma delas é secreta:
// tudo que começa com VITE_ vai junto com o app para o celular.

import { criarCliente } from "./supabase.js";

const env = import.meta.env ?? {};

export const URL_SUPABASE = env.VITE_SUPABASE_URL ?? "";
export const CHAVE_PUBLICA = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const VAPID_PUBLICA = env.VITE_VAPID_PUBLIC_KEY ?? "";
export const PRODUCAO = Boolean(env.PROD);
// Anti-robô (Cloudflare Turnstile): chave PÚBLICA do site. Com ela, os envios
// passam pelo servidor (api/enviar.js), que confere se é uma pessoa.
export const TURNSTILE_SITE_KEY = env.VITE_TURNSTILE_SITE_KEY ?? "";
export const VERIFICACAO_LIGADA = Boolean(TURNSTILE_SITE_KEY);

export const BANCO_LIGADO = Boolean(URL_SUPABASE && CHAVE_PUBLICA);
export const LEMBRETE_CONFIGURADO = BANCO_LIGADO && Boolean(VAPID_PUBLICA);

export const banco = BANCO_LIGADO ? criarCliente({ url: URL_SUPABASE, chave: CHAVE_PUBLICA }) : null;
