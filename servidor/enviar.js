// Regras do envio protegido pelo anti-robô (usadas por api/enviar.js).
// 1. Confere com a Cloudflare (Turnstile) se quem enviou é uma pessoa.
// 2. Grava no banco com a chave do servidor, SÓ com os campos permitidos.

import { cabecalhos } from "../src/lib/supabase.js";

// Campos que o morador pode enviar (qualquer outro é ignorado: proteção contra mass assignment).
export const CAMPOS_RESPOSTA = [
  "tipo",
  "condominio_id",
  "nome",
  "apartamento",
  "nota_coleta",
  "nota_mobilizacao",
  "nota_atendimento",
  "nps",
  "habito",
  "motivos",
  "detalhes",
  "texto",
];
export const CAMPOS_INSCRICAO = ["p_endpoint", "p_p256dh", "p_auth", "p_condominio_id"];

export function soCamposPermitidos(dados, campos) {
  const limpo = {};
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) return limpo;
  for (const campo of campos) if (campo in dados) limpo[campo] = dados[campo];
  return limpo;
}

const VERIFICACAO = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Pergunta à Cloudflare se o "comprovante" do anti-robô é válido.
export async function verificarHumano({ token, segredo, ip, buscar = globalThis.fetch }) {
  if (!token || typeof token !== "string" || token.length > 2048) return false;
  const corpo = new URLSearchParams({ secret: segredo, response: token });
  if (ip) corpo.set("remoteip", ip);
  try {
    const r = await buscar(VERIFICACAO, { method: "POST", body: corpo });
    const dados = await r.json();
    return dados?.success === true;
  } catch {
    return false;
  }
}

// Recebe { acao, dados, token } e devolve { status, corpo } para responder ao app.
export async function processarEnvio({ pedido, ip, segredoTurnstile, urlBanco, chaveBanco, buscar = globalThis.fetch }) {
  const { acao, dados, token } = pedido ?? {};
  if (acao !== "resposta" && acao !== "inscricao") return { status: 400, corpo: { ok: false, motivo: "invalido" } };

  if (!(await verificarHumano({ token, segredo: segredoTurnstile, ip, buscar }))) {
    return { status: 403, corpo: { ok: false, motivo: "robo" } };
  }

  const base = urlBanco.replace(/\/+$/, "");
  const [endereco, corpo] =
    acao === "resposta"
      ? [`${base}/rest/v1/respostas`, soCamposPermitidos(dados, CAMPOS_RESPOSTA)]
      : [`${base}/rest/v1/rpc/salvar_inscricao`, soCamposPermitidos(dados, CAMPOS_INSCRICAO)];

  try {
    const r = await buscar(endereco, {
      method: "POST",
      headers: { ...cabecalhos(chaveBanco), Prefer: "return=minimal" },
      body: JSON.stringify(corpo),
    });
    if (r.ok) return { status: 200, corpo: { ok: true } };
    const texto = typeof r.text === "function" ? await r.text().catch(() => "") : "";
    if (texto.includes("limite_de_envios")) return { status: 429, corpo: { ok: false, motivo: "limite" } };
    return { status: r.status >= 500 ? 502 : 400, corpo: { ok: false, motivo: "invalido" } };
  } catch {
    return { status: 502, corpo: { ok: false, motivo: "erro" } };
  }
}
