import { test } from "node:test";
import assert from "node:assert/strict";

import { processarEnvio, soCamposPermitidos, verificarHumano, CAMPOS_RESPOSTA } from "../servidor/enviar.js";
import { enviarPeloServidor } from "../src/lib/envio.js";
import handler from "../api/enviar.js";

// Simula a Cloudflare e o banco: registra os pedidos e responde o que a gente quiser.
function servidoresFalsos({ humano = true, banco = { ok: true, status: 201, texto: "" } } = {}) {
  const pedidos = [];
  const buscar = async (endereco, opcoes = {}) => {
    pedidos.push({ endereco: String(endereco), opcoes });
    if (String(endereco).includes("challenges.cloudflare.com")) return { json: async () => ({ success: humano }) };
    return { ok: banco.ok, status: banco.status, text: async () => banco.texto };
  };
  return { pedidos, buscar };
}

const base = { segredoTurnstile: "segredo-turnstile", urlBanco: "https://x.supabase.co", chaveBanco: "sb_secret_t" };

test("anti-robô: sem verificação válida, nada é gravado", async () => {
  const { pedidos, buscar } = servidoresFalsos({ humano: false });
  const r = await processarEnvio({ ...base, buscar, pedido: { acao: "resposta", dados: { tipo: "duvida" }, token: "abc" } });
  assert.deepEqual(r, { status: 403, corpo: { ok: false, motivo: "robo" } });
  assert.equal(pedidos.filter((p) => p.endereco.includes("supabase")).length, 0);

  const semToken = await processarEnvio({ ...base, buscar, pedido: { acao: "resposta", dados: {} } });
  assert.equal(semToken.corpo.motivo, "robo");
});

test("anti-robô: pessoa verificada → grava só os campos permitidos", async () => {
  const { pedidos, buscar } = servidoresFalsos();
  const dados = { tipo: "elogio", condominio_id: "monaco", texto: "Ótimo!", lida: true, id: "x", criado_em: "2020-01-01" };
  const r = await processarEnvio({ ...base, buscar, ip: "1.2.3.4", pedido: { acao: "resposta", dados, token: "tok" } });
  assert.deepEqual(r, { status: 200, corpo: { ok: true } });

  const cloudflare = pedidos.find((p) => p.endereco.includes("cloudflare"));
  assert.equal(cloudflare.opcoes.body.get("secret"), "segredo-turnstile");
  assert.equal(cloudflare.opcoes.body.get("response"), "tok");
  assert.equal(cloudflare.opcoes.body.get("remoteip"), "1.2.3.4");

  const gravacao = pedidos.find((p) => p.endereco === "https://x.supabase.co/rest/v1/respostas");
  assert.deepEqual(JSON.parse(gravacao.opcoes.body), { tipo: "elogio", condominio_id: "monaco", texto: "Ótimo!" });
  assert.equal(gravacao.opcoes.headers.apikey, "sb_secret_t");
});

test("anti-robô: inscrição do lembrete vai para a função do banco", async () => {
  const { pedidos, buscar } = servidoresFalsos();
  const dados = { p_endpoint: "https://fcm.googleapis.com/x", p_p256dh: "p", p_auth: "a", p_condominio_id: "monaco", extra: 1 };
  await processarEnvio({ ...base, buscar, pedido: { acao: "inscricao", dados, token: "tok" } });
  const chamada = pedidos.find((p) => p.endereco.endsWith("/rpc/salvar_inscricao"));
  assert.deepEqual(Object.keys(JSON.parse(chamada.opcoes.body)), ["p_endpoint", "p_p256dh", "p_auth", "p_condominio_id"]);
});

test("anti-robô: limite contra spam e pedidos estranhos", async () => {
  const limite = servidoresFalsos({ banco: { ok: false, status: 400, texto: '{"message":"limite_de_envios: x"}' } });
  const r = await processarEnvio({ ...base, buscar: limite.buscar, pedido: { acao: "resposta", dados: {}, token: "t" } });
  assert.deepEqual(r, { status: 429, corpo: { ok: false, motivo: "limite" } });

  const outra = await processarEnvio({ ...base, buscar: servidoresFalsos().buscar, pedido: { acao: "apagar-tudo", token: "t" } });
  assert.equal(outra.status, 400);
  assert.deepEqual(soCamposPermitidos(["a"], CAMPOS_RESPOSTA), {});
  assert.deepEqual(soCamposPermitidos(null, CAMPOS_RESPOSTA), {});
  assert.equal(await verificarHumano({ token: "x".repeat(3000), segredo: "s", buscar: async () => assert.fail() }), false);
});

test("api/enviar: só aceita POST e não funciona sem as chaves", async () => {
  const resposta = () => ({ codigo: 0, corpo: null, status(c) { this.codigo = c; return this; }, json(c) { this.corpo = c; return this; } });
  const antes = { ...process.env };
  try {
    delete process.env.TURNSTILE_SECRET_KEY;
    const get = resposta();
    await handler({ method: "GET", headers: {} }, get);
    assert.equal(get.codigo, 405);
    const semChave = resposta();
    await handler({ method: "POST", headers: {}, body: {} }, semChave);
    assert.equal(semChave.codigo, 500);
  } finally {
    process.env = antes;
  }
});

test("app: entende a resposta do servidor (ok, robô, limite, sem internet)", async () => {
  const comResposta = (status, corpo) => async () => ({ ok: status === 200, status, json: async () => corpo });
  assert.deepEqual(await enviarPeloServidor("resposta", {}, "t", comResposta(200, { ok: true })), { ok: true });
  assert.equal((await enviarPeloServidor("resposta", {}, "t", comResposta(403, { ok: false, motivo: "robo" }))).robo, true);
  assert.equal((await enviarPeloServidor("resposta", {}, "t", comResposta(429, { ok: false, motivo: "limite" }))).limite, true);
  const semInternet = await enviarPeloServidor("resposta", {}, "t", async () => {
    throw new Error("offline");
  });
  assert.deepEqual(semInternet, { ok: false, status: 0 });
});
