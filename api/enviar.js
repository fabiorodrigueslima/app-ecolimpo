// Função da Vercel: https://app.cooperaecolimpo.com.br/api/enviar
// Recebe a pesquisa, a mensagem ou a inscrição do lembrete, confere o anti-robô
// (Cloudflare Turnstile) e só então grava no banco.
//
// Variáveis de ambiente (painel da Vercel, NUNCA no código):
//   TURNSTILE_SECRET_KEY   chave secreta do Turnstile (Cloudflare)
//   VITE_SUPABASE_URL      endereço do Supabase
//   SUPABASE_SECRET_KEY    chave secreta do Supabase

import { processarEnvio } from "../servidor/enviar.js";

const NECESSARIAS = ["TURNSTILE_SECRET_KEY", "VITE_SUPABASE_URL", "SUPABASE_SECRET_KEY"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, motivo: "invalido" });
  if (NECESSARIAS.some((nome) => !process.env[nome])) {
    console.error("api/enviar: faltam variáveis de ambiente");
    return res.status(500).json({ ok: false, motivo: "erro" });
  }

  let pedido = req.body;
  if (typeof pedido === "string") {
    try {
      pedido = JSON.parse(pedido);
    } catch {
      return res.status(400).json({ ok: false, motivo: "invalido" });
    }
  }

  const ip = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || undefined;
  const { status, corpo } = await processarEnvio({
    pedido,
    ip,
    segredoTurnstile: process.env.TURNSTILE_SECRET_KEY,
    urlBanco: process.env.VITE_SUPABASE_URL,
    chaveBanco: process.env.SUPABASE_SECRET_KEY,
  });
  if (!corpo.ok) console.warn("api/enviar recusou:", corpo.motivo);
  return res.status(status).json(corpo);
}
