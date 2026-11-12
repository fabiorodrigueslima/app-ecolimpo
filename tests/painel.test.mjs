import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  sessaoDaResposta,
  precisaRenovar,
  lerRetornoDoEmail,
  mensagemDeErroDoLogin,
  validarNovaSenha,
  montarFiltroRespostas,
  resumoNotas,
  rotuloMotivo,
  lerAal,
  etapaDoMfa,
  codigoValido,
  paraCsv,
  gerarId,
  validarCondominio,
  linhaDoCondominio,
  mensagemWhatsApp,
  linkWhatsApp,
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

test("resumo da pesquisa: satisfeitos, médias, NPS, motivos e hábito", () => {
  const r = resumoNotas([
    { tipo: "pesquisa", nota_coleta: 5, nota_mobilizacao: 4, nota_atendimento: null, nps: 10, habito: "sempre" },
    { tipo: "pesquisa", nota_coleta: 4, nota_mobilizacao: 2, nota_atendimento: 3, nps: 8, habito: "sempre", motivos: ["mobilizacao:nao_claras"] },
    {
      tipo: "pesquisa",
      nota_coleta: 1,
      nota_mobilizacao: null,
      nota_atendimento: 5,
      nps: 3,
      habito: "as_vezes",
      motivos: ["coleta:nao_passou", "mobilizacao:nao_claras"],
    },
    { tipo: "pesquisa", nota_coleta: 5, nota_mobilizacao: 5, nota_atendimento: null, nps: 9, habito: "ainda_nao" },
    { tipo: "elogio", texto: "Muito bom" },
  ]);
  assert.equal(r.total, 5);
  assert.equal(r.pesquisas, 4);
  assert.deepEqual(r.medias, { coleta: 3.8, mobilizacao: 3.7, atendimento: 4 });
  // Coleta: 3 de 4 deram 4 ou 5. Atendimento: só 2 responderam ("Não sei" fica de fora).
  assert.deepEqual(r.temas.coleta, { respostas: 4, satisfeitos: 75 });
  assert.deepEqual(r.temas.atendimento, { respostas: 2, satisfeitos: 50 });
  // NPS: 2 promotores (10 e 9), 1 neutro (8), 1 detrator (3) -> 50% - 25% = +25
  assert.deepEqual(r.nps, { respostas: 4, valor: 25, promotores: 50, neutros: 25, detratores: 25 });
  assert.deepEqual(
    r.motivos.map((m) => [m.rotulo, m.total]),
    [
      ["Mobilização e orientação: As orientações não são claras", 2],
      ["Coleta seletiva: Não passou no dia", 1],
    ],
  );
  assert.deepEqual(r.habito, { respostas: 4, sempre: 50, as_vezes: 25, ainda_nao: 25 });

  const vazio = resumoNotas([]);
  assert.deepEqual(vazio.medias, { coleta: null, mobilizacao: null, atendimento: null });
  assert.equal(vazio.nps.valor, null);
  assert.equal(rotuloMotivo("coisa:estranha"), "coisa:estranha");
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
    dias_poda: [],
    horario: "14:00",
    piloto: true,
    ativo: true,
  });
  assert.deepEqual(linhaDoCondominio({ nome: "M", dias: [4, 2], dias_poda: [1, 1], horario: "14:00" }).dias_poda, [1]);
  assert.ok(validarCondominio({ nome: "X", dias: [2], dias_poda: [9], horario: "14:00" }).erros.dias_poda);
  assert.equal(validarCondominio({ nome: "Mirante", dias: [2], dias_poda: [1], horario: "14:00" }).ok, true);
});

test("mensagem para o WhatsApp usa os dados do condomínio e o link dele", () => {
  const texto = mensagemWhatsApp(
    { id: "condominio-prive-monaco", nome: " Condomínio Mônaco ", dias: [4, 2], horario: "09:00" },
    "https://app.exemplo.com.br",
  );
  assert.match(texto, /moradores do \*Condomínio Mônaco\*!/);
  assert.match(texto, /toda \*terça-feira e quinta-feira\*, às \*9h\*\./);
  assert.match(texto, /\nhttps:\/\/app\.exemplo\.com\.br\/\?c=condominio-prive-monaco\n/);
  assert.doesNotMatch(texto, /A PREENCHER|undefined|null/);

  const link = linkWhatsApp(texto);
  assert.ok(link.startsWith("https://wa.me/?text="));
  assert.equal(decodeURIComponent(link.slice("https://wa.me/?text=".length)), texto);
});

test("mensagem do WhatsApp fala da poda só quando o condomínio tem poda", () => {
  const mirante = mensagemWhatsApp({ id: "m", nome: "Mirante", dias: [2, 4], dias_poda: [1], horario: "14:00" }, "https://a.b");
  assert.match(mirante, /recicláveis é toda \*terça-feira e quinta-feira\*, às \*14h\*/);
  assert.match(mirante, /coleta de podas .* é toda \*segunda-feira\*, às \*14h\*/);
  const outro = mensagemWhatsApp({ id: "o", nome: "Outro", dias: [2], dias_poda: [], horario: "09:00" }, "https://a.b");
  assert.doesNotMatch(outro, /poda/i);
});

test("SQL 014: coluna de poda, funções do app devolvem dias_poda e Mirante ajustado", () => {
  const sql = readFileSync(new URL("../supabase/014_coleta_podas.sql", import.meta.url), "utf8");
  assert.match(sql, /add column if not exists dias_poda smallint\[\]/);
  assert.equal((sql.match(/select c\.id, c\.nome, c\.regiao, c\.dias, c\.dias_poda, c\.horario, c\.piloto/g) ?? []).length, 2);
  assert.match(sql, /grant execute on function public\.condominio_por_id\(text\) to anon, authenticated/);
  assert.match(sql, /grant execute on function public\.buscar_condominios\(text\) to anon, authenticated/);
  assert.match(sql, /grant update \(dias_poda\)/);
  assert.match(sql, /set dias = '\{2,4\}', dias_poda = '\{1\}'.*\n\s*where id = 'condominio-ecologico-parque-do-mirante'/);
});

test("condomínio vindo do banco fica no formato do app", () => {
  assert.deepEqual(normalizarCondominio({ id: "a", nome: "A", regiao: null, dias: ["5", 1], horario: "09:00", piloto: null }), {
    id: "a",
    nome: "A",
    regiao: "",
    dias: [1, 5],
    diasPoda: [],
    horario: "09:00",
    piloto: false,
  });
  assert.deepEqual(normalizarCondominio({ id: "m", nome: "M", dias: [4, 2], dias_poda: ["1"], horario: "14:00" }).diasPoda, [1]);
});

test("servidor do lembrete lê só condomínios ativos", async () => {
  let endereco = "";
  const banco = criarBancoServidor({
    url: "https://x.supabase.co",
    chave: "sb_secret_t",
    buscar: async (e) => {
      endereco = e;
      return {
        ok: true,
        json: async () => [
          { id: "a", nome: "A", dias: ["2"], dias_poda: null, horario: "09:00" },
          { id: "m", nome: "M", dias: [2, 4], dias_poda: ["1"], horario: "14:00" },
        ],
      };
    },
  });
  assert.deepEqual(await banco.buscarCondominios(), [
    { id: "a", nome: "A", dias: [2], diasPoda: [], horario: "09:00" },
    { id: "m", nome: "M", dias: [2, 4], diasPoda: [1], horario: "14:00" },
  ]);
  assert.match(endereco, /condominios\?select=id,nome,dias,dias_poda,horario&ativo=is\.true$/);
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

// ---------- Verificação em 2 etapas ----------

const tokenFalso = (conteudo) =>
  `cabecalho.${Buffer.from(JSON.stringify(conteudo)).toString("base64url")}.assinatura`;

test("2 etapas: lê o nível do login dentro do token", () => {
  assert.equal(lerAal(tokenFalso({ aal: "aal2", email: "x@y.com" })), "aal2");
  assert.equal(lerAal(tokenFalso({ aal: "aal1" })), "aal1");
  assert.equal(lerAal(tokenFalso({})), "aal1");
  assert.equal(lerAal("lixo"), "aal1"); // token estranho conta como só senha
});

test("2 etapas: decide entre cadastrar, pedir código ou entrar", () => {
  const verificado = { id: "f1", factor_type: "totp", status: "verified" };
  const naoTerminado = { id: "f2", factor_type: "totp", status: "unverified" };
  assert.equal(etapaDoMfa([], "aal1"), "cadastrar");
  assert.equal(etapaDoMfa([naoTerminado], "aal1"), "cadastrar"); // cadastro abandonado: começa de novo
  assert.equal(etapaDoMfa([verificado], "aal1"), "codigo");
  assert.equal(etapaDoMfa([verificado], "aal2"), "pronto");
});

test("2 etapas: código precisa ter exatamente 6 números", () => {
  assert.equal(codigoValido("123456"), true);
  assert.equal(codigoValido(" 123456 "), true);
  assert.equal(codigoValido("12345"), false);
  assert.equal(codigoValido("12345a"), false);
});

test("2 etapas: o banco (SQL 012) exige aal2 para a equipe", () => {
  const sql = readFileSync(new URL("../supabase/012_painel_duas_etapas.sql", import.meta.url), "utf8");
  assert.match(sql, /auth\.jwt\(\) ->> 'aal', 'aal1'\) = 'aal2'/);
});
