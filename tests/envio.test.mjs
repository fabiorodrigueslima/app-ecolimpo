import { test } from "node:test";
import assert from "node:assert/strict";

import { montarPedido, criarInsercao, cabecalhos } from "../src/lib/supabase.js";
import { enviarResposta, ENVIO_LIGADO } from "../src/lib/envio.js";
import { montarMensagem } from "../src/lib/formularios.js";

const URL = "https://exemplo.supabase.co/";
const CHAVE = "sb_publishable_teste";

test("pedido de envio vai para a tabela certa, sem pedir a linha de volta", () => {
  const dados = { tipo: "duvida", condominio_id: "a", texto: "Que dia passa?" };
  const { endereco, opcoes } = montarPedido(URL, CHAVE, "respostas", dados);
  assert.equal(endereco, "https://exemplo.supabase.co/rest/v1/respostas");
  assert.equal(opcoes.method, "POST");
  assert.equal(opcoes.headers.apikey, CHAVE);
  assert.equal(opcoes.headers.Prefer, "return=minimal");
  assert.equal(opcoes.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(opcoes.body), dados);
});

test("chave anon antiga também vai no Authorization", () => {
  assert.equal(cabecalhos("eyJabc").Authorization, "Bearer eyJabc");
});

test("envio de mensagem chega ao banco com os campos certos", async () => {
  const pedidos = [];
  const buscar = async (endereco, opcoes) => {
    pedidos.push({ endereco, corpo: JSON.parse(opcoes.body) });
    return { ok: true, status: 201 };
  };
  const inserir = criarInsercao({ url: URL, chave: CHAVE, buscar });
  const resposta = montarMensagem({ condominioId: "a", tipo: "elogio", texto: " Ótimo trabalho! ", nome: "", apartamento: "" });

  assert.deepEqual(await inserir("respostas", resposta), { ok: true });
  assert.deepEqual(pedidos[0].corpo, {
    tipo: "elogio",
    condominio_id: "a",
    nome: null,
    apartamento: null,
    texto: "Ótimo trabalho!",
  });
});

test("erro do banco ou falta de internet viram falha (app pede para tentar de novo)", async () => {
  const recusou = criarInsercao({ url: URL, chave: CHAVE, buscar: async () => ({ ok: false, status: 401 }) });
  assert.deepEqual(await recusou("respostas", {}), { ok: false, status: 401, limite: false });

  // Proteção contra spam: o banco responde "limite_de_envios" e o app reconhece.
  const limite = criarInsercao({
    url: URL,
    chave: CHAVE,
    buscar: async () => ({
      ok: false,
      status: 400,
      text: async () => '{"code":"P0001","message":"limite_de_envios: muitos envios deste condomínio agora"}',
    }),
  });
  assert.deepEqual(await limite("respostas", {}), { ok: false, status: 400, limite: true });

  const semInternet = criarInsercao({
    url: URL,
    chave: CHAVE,
    buscar: async () => {
      throw new TypeError("Failed to fetch");
    },
  });
  assert.deepEqual(await semInternet("respostas", {}), { ok: false, status: 0 });

  const demorou = criarInsercao({
    url: URL,
    chave: CHAVE,
    limiteMs: 20,
    buscar: (_e, { signal }) =>
      new Promise((_ok, falhar) => signal.addEventListener("abort", () => falhar(new Error("abortado")))),
  });
  assert.deepEqual(await demorou("respostas", {}), { ok: false, status: 0 });
});

test("sem variáveis de ambiente, fica em modo de teste", async () => {
  assert.equal(ENVIO_LIGADO, false);
  assert.deepEqual(await enviarResposta({}), { ok: true, teste: true });
});
