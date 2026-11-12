// Função da Vercel: https://app.cooperaecolimpo.com.br/api/lembrete
// Chamada todo dia às 6h30 (Brasília) pelo "despertador" do Supabase
// (supabase/003_agendamento.sql). Envia o lembrete da coleta do dia.
//
// Variáveis de ambiente (configurar no painel da Vercel, NUNCA no código):
//   VITE_SUPABASE_URL       endereço do Supabase (o mesmo do app)
//   SUPABASE_SECRET_KEY     chave SECRETA do Supabase (sb_secret_...)
//   VITE_VAPID_PUBLIC_KEY   chave pública do lembrete (a mesma do app)
//   VAPID_PRIVATE_KEY       chave privada do lembrete
//   LEMBRETE_SEGREDO        senha que o despertador manda para poder chamar

import * as webpush from "web-push";
import { contatos } from "../src/data/contatos.js";
import { criarBancoServidor } from "../servidor/banco.js";
import { enviarLembretesDoDia, pedidoAutorizado, registroDoEnvio } from "../servidor/lembrete.js";
import { hojeISO } from "../src/lib/avisos.js";

const NECESSARIAS = ["VITE_SUPABASE_URL", "SUPABASE_SECRET_KEY", "VITE_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "LEMBRETE_SEGREDO"];

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ erro: "Use POST." });
  }
  if (!pedidoAutorizado(req.headers.authorization, process.env.LEMBRETE_SEGREDO)) {
    return res.status(401).json({ erro: "Não autorizado." });
  }
  const faltando = NECESSARIAS.filter((nome) => !process.env[nome]);
  if (faltando.length) {
    return res.status(500).json({ erro: "Faltam variáveis de ambiente.", faltando });
  }

  const banco = criarBancoServidor({ url: process.env.VITE_SUPABASE_URL, chave: process.env.SUPABASE_SECRET_KEY });

  // Chave do lembrete com formato errado: anota o erro (o painel avisa) em vez de cair.
  try {
    webpush.setVapidDetails(`mailto:${contatos.email}`, process.env.VITE_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  } catch (erro) {
    console.error("Chave do lembrete (VAPID) inválida:", erro.message);
    await anotar(banco, registroDoEnvio(null, new Error("Chave do lembrete (VAPID) com formato errado na Vercel.")));
    return res.status(500).json({ erro: "Chave do lembrete com formato errado." });
  }

  try {
    const resumo = await enviarLembretesDoDia({
      condominios: await banco.buscarCondominios(),
      // Se os avisos falharem, o lembrete da coleta continua saindo.
      avisos: await banco.buscarAvisosDoDia(hojeISO()).catch((erro) => {
        console.error("Avisos do dia não lidos:", erro.message);
        return [];
      }),
      buscarInscricoes: banco.buscarInscricoes,
      apagarInscricao: banco.apagarInscricao,
      // TTL: se o celular estiver desligado, o aviso espera até 6 horas (depois perde o sentido).
      enviarPush: (inscricao, corpo) => webpush.sendNotification(inscricao, corpo, { TTL: 6 * 3600, urgency: "high" }),
    });
    console.log("Lembrete da coleta:", JSON.stringify(resumo));
    await anotar(banco, registroDoEnvio(resumo));
    return res.status(200).json(resumo);
  } catch (erro) {
    console.error("Lembrete da coleta falhou:", erro.message);
    await anotar(banco, registroDoEnvio(null, erro));
    return res.status(502).json({ erro: "Falha ao ler o banco (condomínios ou inscrições)." });
  }
}

// Se não der para anotar, o lembrete continua valendo (só registra no log).
async function anotar(banco, registro) {
  try {
    await banco.registrarEnvio(registro);
  } catch (erro) {
    console.error("Não foi possível anotar o envio do lembrete:", erro.message);
  }
}
