import { test } from "node:test";
import assert from "node:assert/strict";

import {
  diaDaSemanaEmBrasilia,
  temColetaNoDia,
  condominiosComColetaNoDia,
  textoLembrete,
  formatarHorario,
  descreverDias,
  proximaColeta,
  proximasColetas,
  rotuloDaColeta,
  conferirCondominios,
} from "../src/lib/coleta.js";
import { normalizar } from "../src/lib/busca.js";
import { validarPesquisa, validarMensagem, montarPesquisa, montarMensagem, tipoDoLink } from "../src/lib/formularios.js";
import { condominios } from "../src/data/condominios.js";

// 10/11/2026 é uma terça-feira.
const TERCA_0630_BRASILIA = new Date("2026-11-10T09:30:00Z"); // horário do lembrete
const TERCA_2300_BRASILIA = new Date("2026-11-11T02:00:00Z"); // já é quarta em UTC
const QUARTA_0001_BRASILIA = new Date("2026-11-11T03:01:00Z");

const manha = { id: "a", nome: "A", dias: [2], horario: "09:00" };
const tarde = { id: "b", nome: "B", dias: [1, 4], horario: "14:00" };

test("dia da semana usa o horário de Brasília", () => {
  assert.equal(diaDaSemanaEmBrasilia(TERCA_0630_BRASILIA), 2);
  assert.equal(diaDaSemanaEmBrasilia(TERCA_2300_BRASILIA), 2);
  assert.equal(diaDaSemanaEmBrasilia(QUARTA_0001_BRASILIA), 3);
});

test("qual condomínio tem coleta em qual dia", () => {
  assert.equal(temColetaNoDia(manha, TERCA_0630_BRASILIA), true);
  assert.equal(temColetaNoDia(tarde, TERCA_0630_BRASILIA), false);
  assert.deepEqual(condominiosComColetaNoDia([manha, tarde], TERCA_0630_BRASILIA).map((c) => c.id), ["a"]);
  assert.deepEqual(condominiosComColetaNoDia([manha, tarde], QUARTA_0001_BRASILIA), []);
});

test("texto do lembrete conforme o horário", () => {
  assert.equal(
    textoLembrete("09:00"),
    "Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às 9h.",
  );
  assert.equal(
    textoLembrete("14:00"),
    "Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às 14h.",
  );
  assert.equal(formatarHorario("14:30"), "14h30");
});

test("descrição dos dias", () => {
  assert.equal(descreverDias([4, 1]), "segunda-feira e quinta-feira");
  assert.equal(descreverDias([1, 3, 5]), "segunda-feira, quarta-feira e sexta-feira");
  assert.equal(descreverDias([]), "A PREENCHER");
});

test("próxima coleta", () => {
  const hoje = proximaColeta(manha, TERCA_0630_BRASILIA);
  assert.equal(hoje.diasAte, 0);
  assert.equal(rotuloDaColeta(hoje), "Hoje");

  const quinta = proximaColeta(tarde, TERCA_0630_BRASILIA);
  assert.equal(quinta.diasAte, 2);
  assert.equal(rotuloDaColeta(quinta), "Quinta-feira, 12/11");

  const lista = proximasColetas(tarde, TERCA_0630_BRASILIA, 3);
  assert.deepEqual(lista.map((c) => `${c.dia}/${c.mes}`), ["12/11", "16/11", "19/11"]);

  assert.equal(proximaColeta({ ...manha, dias: [] }, TERCA_0630_BRASILIA), null);
});

test("arquivo de condomínios está preenchido corretamente", () => {
  assert.deepEqual(conferirCondominios(condominios), []);
  assert.ok(conferirCondominios([{ id: "X y", nome: "", dias: [7], horario: "10:00" }]).length >= 3);
});

test("busca ignora acentos e maiúsculas", () => {
  assert.equal(normalizar("  Alumínio "), "aluminio");
  assert.equal(normalizar("CONDOMÍNIO PRIVE MONACO"), "condominio prive monaco");
});

test("link de dúvida já marca o tipo da mensagem", () => {
  assert.equal(tipoDoLink("?tipo=duvida"), "duvida");
  assert.equal(tipoDoLink("?tipo=elogio"), "elogio");
  assert.equal(tipoDoLink("?tipo=qualquer-coisa"), "");
  assert.equal(tipoDoLink(""), "");
});

const ids = ["a", "b"];

test("pesquisa: só o condomínio e as notas são obrigatórios", () => {
  const dados = { condominioId: "a", notas: { coleta: 5, mobilizacao: 4, atendimento: 3 } };
  assert.equal(validarPesquisa(dados, ids).ok, true);
  assert.deepEqual(montarPesquisa({ ...dados, nome: "  ", melhorar: " Mais avisos " }), {
    tipo: "pesquisa",
    condominio_id: "a",
    nome: null,
    apartamento: null,
    nota_coleta: 5,
    nota_mobilizacao: 4,
    nota_atendimento: 3,
    texto: "Mais avisos",
  });

  const ruim = validarPesquisa({ condominioId: "z", notas: { coleta: 6 } }, ids);
  assert.equal(ruim.ok, false);
  assert.ok(ruim.erros.condominioId);
  assert.ok(ruim.erros.nota_coleta && ruim.erros.nota_mobilizacao && ruim.erros.nota_atendimento);
});

test("mensagem: tipo, texto e condomínio obrigatórios", () => {
  const dados = { condominioId: "b", tipo: "sugestao", texto: "Colocar mais lixeiras", apartamento: "101" };
  assert.equal(validarMensagem(dados, ids).ok, true);
  assert.deepEqual(montarMensagem(dados), {
    tipo: "sugestao",
    condominio_id: "b",
    nome: null,
    apartamento: "101",
    texto: "Colocar mais lixeiras",
  });

  const ruim = validarMensagem({ condominioId: "", tipo: "xingamento", texto: " " }, ids);
  assert.deepEqual(Object.keys(ruim.erros).sort(), ["condominioId", "texto", "tipo"]);
  assert.ok(validarMensagem({ ...dados, texto: "x".repeat(1001) }, ids).erros.texto);
  assert.ok(validarMensagem({ ...dados, nome: "x".repeat(81) }, ids).erros.nome);
});
