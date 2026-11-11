import { test } from "node:test";
import assert from "node:assert/strict";

import { situacaoLembrete, montarBackup, diasDesdeCopia } from "../src/painel/regras.js";
import { registroDoEnvio } from "../servidor/lembrete.js";
import { criarBancoServidor } from "../servidor/banco.js";

const AGORA = new Date("2026-11-12T12:00:00Z"); // 09h00 em Brasília

test("painel: lembrete em dia, atrasado, com erro ou nunca enviado", () => {
  const hoje = { executado_em: "2026-11-12T09:30:00Z", condominios: ["a", "b"], enviados: 40, falhas: 0, removidos: 2, erro: null };
  const ok = situacaoLembrete(hoje, AGORA);
  assert.equal(ok.nivel, "ok");
  assert.match(ok.titulo, /12\/11\/2026,? 06:30/);
  assert.equal(ok.detalhe, "2 condomínio(s) com coleta · 40 aviso(s) enviado(s) · 2 celular(es) que desligaram o aviso");

  const semColeta = situacaoLembrete({ ...hoje, condominios: [], enviados: 0, removidos: 0 }, AGORA);
  assert.equal(semColeta.nivel, "ok");
  assert.match(semColeta.detalhe, /nenhum condomínio tinha coleta/);

  assert.equal(situacaoLembrete({ ...hoje, executado_em: "2026-11-10T09:30:00Z" }, AGORA).nivel, "atencao");
  assert.equal(situacaoLembrete({ ...hoje, erro: "Supabase respondeu 500" }, AGORA).nivel, "atencao");
  assert.equal(situacaoLembrete({ ...hoje, falhas: 3 }, AGORA).nivel, "atencao");
  assert.equal(situacaoLembrete(null, AGORA).nivel, "nunca");
});

test("servidor anota o resumo do envio (e o erro, quando falha)", async () => {
  assert.deepEqual(
    registroDoEnvio({ condominios: ["a"], inscricoes: 5, enviados: 4, removidos: 1, falhas: 0, ignorados: 0 }),
    { condominios: ["a"], inscricoes: 5, enviados: 4, removidos: 1, falhas: 0, erro: null },
  );
  assert.equal(registroDoEnvio(null, new Error("x".repeat(500))).erro.length, 300);

  let pedido;
  const banco = criarBancoServidor({
    url: "https://x.supabase.co",
    chave: "sb_secret_t",
    buscar: async (endereco, opcoes) => {
      pedido = { endereco, opcoes };
      return { ok: true };
    },
  });
  await banco.registrarEnvio({ condominios: [], enviados: 0 });
  assert.equal(pedido.endereco, "https://x.supabase.co/rest/v1/envios_lembrete");
  assert.equal(pedido.opcoes.method, "POST");
  assert.equal(pedido.opcoes.headers.apikey, "sb_secret_t");
});

test("cópia de segurança tem tudo e conta os dias desde a última", () => {
  const copia = montarBackup({
    respostas: [{ id: 1 }, { id: 2 }],
    condominios: [{ id: "a" }],
    geradoEm: AGORA,
  });
  assert.equal(copia.gerado_em, "2026-11-12T12:00:00.000Z");
  assert.deepEqual(copia.totais, { respostas: 2, condominios: 1 });
  assert.equal(copia.respostas.length, 2);
  assert.equal(diasDesdeCopia(null, AGORA), null);
  assert.equal(diasDesdeCopia("2026-10-12T12:00:00Z", AGORA), 31);
  assert.equal(diasDesdeCopia("2026-11-11T13:00:00Z", AGORA), 0);
});
