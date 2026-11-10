import { test } from "node:test";
import assert from "node:assert/strict";

import {
  sessaoDaResposta,
  precisaRenovar,
  lerRetornoDoEmail,
  mensagemDeErroDoLogin,
  validarNovaSenha,
  montarFiltroRespostas,
  resumoNotas,
  paraCsv,
  gerarId,
  validarCondominio,
  linhaDoCondominio,
} from "../src/painel/regras.js";
import { normalizarCondominio } from "../src/lib/condominios.js";
import { criarBancoServidor } from "../servidor/banco.js";
import { requisitar } from "../src/lib/supabase.js";

// ---------- Login ----------

test("sessão do login e hora de renovar", () => {
  const s = sessaoDaResposta({ access_token: "a", refresh_token: "r", expires_in: 3600, user: { email: "x@y.com" } }, 1000);
  assert.deepEqual(s, { token: "a", renovacao: "r", expiraEm: 4600, email: "x@y.com" });
  assert.equal(precisaRenovar(s, 4000), false);
  assert.equal(precisaRenovar(s, 4541), true); // falta menos de 1 minuto
  assert.equal(precisaRenovar(null), true);
});

test("link do e-mail de nova senha", () => {
  const r = lerRetornoDoEmail("#access_token=tok&expires_in=3600&refresh_token=ref&token_type=bearer&type=recovery");
  assert.equal(r.tipo, "recovery");
  assert.equal(r.sessao.token, "tok");
  assert.equal(r.sessao.renovacao, "ref");
  assert.deepEqual(lerRetornoDoEmail("#error=access_denied&error_description=Link+expirado"), { erro: "Link expirado" });
  assert.equal(lerRetornoDoEmail(""), null);
  assert.equal(lerRetornoDoEmail("#access_token=tok&type=outra-coisa"), null);
});

test("mensagens de erro do login em português", () => {
  assert.equal(mensagemDeErroDoLogin(400, { error_code: "invalid_credentials" }), "E-mail ou senha incorretos.");
  assert.match(mensagemDeErroDoLogin(429), /Muitas tentativas/);
  assert.match(mensagemDeErroDoLogin(0), /Sem conexão/);
  assert.match(mensagemDeErroDoLogin(422, { error_code: "weak_password" }), /tente de novo/i);
  assert.match(mensagemDeErroDoLogin(400, { error_code: "weak_password" }), /Senha fraca/);
});

test("nova senha", () => {
  assert.match(validarNovaSenha("abc1", "abc1"), /8 caracteres/);
  assert.match(validarNovaSenha("abcdefgh", "abcdefgh"), /letras e números/);
  assert.match(validarNovaSenha("abcd1234", "abcd12345"), /não são iguais/);
  assert.equal(validarNovaSenha("abcd1234", "abcd1234"), "");
});

// ---------- Respostas ----------

test("filtros das respostas viram a consulta certa", () => {
  const agora = new Date("2026-11-10T12:00:00Z");
  assert.deepEqual(montarFiltroRespostas({ tipo: "todas", periodo: "tudo" }, agora), []);
  assert.deepEqual(
    montarFiltroRespostas({ tipo: "reclamacao", condominio: "jardins", periodo: "7", soNaoLidas: true }, agora),
    ["tipo=eq.reclamacao", "condominio_id=eq.jardins", "criado_em=gte.2026-11-03T12%3A00%3A00.000Z", "lida=is.false"],
  );
  assert.deepEqual(montarFiltroRespostas({ tipo: "mensagens" }, agora), ["tipo=neq.pesquisa"]);
});

test("médias das notas", () => {
  const r = resumoNotas([
    { tipo: "pesquisa", nota_coleta: 5, nota_mobilizacao: 4, nota_atendimento: 3 },
    { tipo: "pesquisa", nota_coleta: 4, nota_mobilizacao: 4, nota_atendimento: 4 },
    { tipo: "elogio", texto: "Muito bom" },
  ]);
  assert.deepEqual(r, { total: 3, pesquisas: 2, medias: { coleta: 4.5, mobilizacao: 4, atendimento: 3.5 } });
  assert.deepEqual(resumoNotas([]).medias, { coleta: null, mobilizacao: null, atendimento: null });
});

test("planilha CSV abre no Excel e não executa fórmulas", () => {
  const csv = paraCsv(
    [
      {
        criado_em: "2026-11-10T12:30:00Z",
        condominio_id: "jardins",
        tipo: "sugestao",
        texto: '=HYPERLINK("x"); "oi"',
        nome: null,
        apartamento: "101",
        lida: false,
      },
    ],
    { jardins: "Jardins" },
  );
  assert.ok(csv.startsWith("﻿Data;Condomínio;Tipo"));
  const linha = csv.split("\r\n")[1];
  assert.match(linha, /^10\/11\/2026,? 09:30;Jardins;Sugestão;;;;/);
  assert.match(linha, /"'=HYPERLINK\(""x""\); ""oi"""/);
  assert.match(linha, /;101;não$/);
});

// ---------- Condomínios ----------

test("apelido (id) gerado a partir do nome", () => {
  assert.equal(gerarId("Condomínio Jardins do Lago II"), "condominio-jardins-do-lago-ii");
  assert.equal(gerarId("Jardins", ["jardins"]), "jardins-2");
  assert.equal(gerarId("Jardins", ["jardins", "jardins-2"]), "jardins-3");
  assert.equal(gerarId("!!!"), "condominio");
});

test("cadastro de condomínio: confere os campos", () => {
  assert.equal(validarCondominio({ nome: "Jardins", dias: [2, 5], horario: "09:00" }).ok, true);
  const ruim = validarCondominio({ nome: " ", dias: [], horario: "10:00" });
  assert.deepEqual(Object.keys(ruim.erros).sort(), ["dias", "horario", "nome"]);
  assert.ok(validarCondominio({ nome: "X", dias: [7], horario: "14:00" }).erros.dias);

  assert.deepEqual(linhaDoCondominio({ nome: " Jardins ", regiao: " ", dias: [5, 2, 5], horario: "14:00", piloto: 1, ativo: true }), {
    nome: "Jardins",
    regiao: null,
    dias: [2, 5],
    horario: "14:00",
    piloto: true,
    ativo: true,
  });
});

test("condomínio vindo do banco fica no formato do app", () => {
  assert.deepEqual(normalizarCondominio({ id: "a", nome: "A", regiao: null, dias: ["5", 1], horario: "09:00", piloto: null }), {
    id: "a",
    nome: "A",
    regiao: "",
    dias: [1, 5],
    horario: "09:00",
    piloto: false,
  });
});

test("servidor do lembrete lê só condomínios ativos", async () => {
  let endereco = "";
  const banco = criarBancoServidor({
    url: "https://x.supabase.co",
    chave: "sb_secret_t",
    buscar: async (e) => {
      endereco = e;
      return { ok: true, json: async () => [{ id: "a", nome: "A", dias: ["2"], horario: "09:00" }] };
    },
  });
  assert.deepEqual(await banco.buscarCondominios(), [{ id: "a", nome: "A", dias: [2], horario: "09:00" }]);
  assert.match(endereco, /condominios\?select=id,nome,dias,horario&ativo=is\.true$/);
});

test("pedido do painel leva o login (token) e lê a resposta", async () => {
  let pedido;
  const r = await requisitar(
    {
      url: "https://x.supabase.co",
      chave: "sb_publishable_t",
      token: "token-da-equipe",
      buscar: async (e, o) => {
        pedido = { e, o };
        return { ok: true, status: 200, text: async () => '[{"id":1}]' };
      },
    },
    "PATCH",
    "rest/v1/respostas?id=eq.1",
    { corpo: { lida: true }, prefer: "return=minimal" },
  );
  assert.deepEqual(r, { ok: true, status: 200, dados: [{ id: 1 }] });
  assert.equal(pedido.o.headers.Authorization, "Bearer token-da-equipe");
  assert.equal(pedido.o.headers.apikey, "sb_publishable_t");
  assert.equal(pedido.o.method, "PATCH");
  assert.equal(pedido.o.body, '{"lida":true}');
});
