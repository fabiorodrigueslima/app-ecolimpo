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
  coletasDoDia,
  proximaPoda,
  proximasColetasComTipo,
} from "../src/lib/coleta.js";
import { normalizar } from "../src/lib/busca.js";
import {
  validarPesquisa,
  validarMensagem,
  montarPesquisa,
  montarMensagem,
  tipoDoLink,
  pesquisaVazia,
  notaBaixa,
  mesDeReferencia,
  jaRespondeuNoMes,
} from "../src/lib/formularios.js";
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

const pesquisaCompleta = () => ({
  ...pesquisaVazia("a"),
  notas: { coleta: 5, mobilizacao: "nao_sei", atendimento: 2 },
  motivos: { coleta: ["nao_passou"], atendimento: ["demorou", "inventado"] },
  detalhes: { coleta: "não deveria ir", atendimento: " Esperei 3 dias " },
  nps: 9,
  habito: "as_vezes",
  melhorar: " Mais avisos ",
  nome: "  ",
});

test("pesquisa completa: Não sei vira vazio e motivos só valem para nota baixa", () => {
  assert.equal(validarPesquisa(pesquisaCompleta(), ids).ok, true);
  assert.deepEqual(montarPesquisa(pesquisaCompleta()), {
    tipo: "pesquisa",
    condominio_id: "a",
    nome: null,
    apartamento: null,
    nota_coleta: 5,
    nota_mobilizacao: null, // "Não sei / não utilizei" não entra na média
    nota_atendimento: 2,
    nps: 9,
    habito: "as_vezes",
    motivos: ["atendimento:demorou"], // coleta teve nota boa; "inventado" não existe
    detalhes: { atendimento: "Esperei 3 dias" },
    texto: "Mais avisos",
  });
});

test("pesquisa: cada pergunta precisa de resposta", () => {
  const ruim = validarPesquisa({ ...pesquisaVazia("z"), notas: { coleta: 6 }, nps: 11, habito: "nunca" }, ids);
  assert.equal(ruim.ok, false);
  assert.deepEqual(Object.keys(ruim.erros).sort(), [
    "condominioId",
    "habito",
    "nota_atendimento",
    "nota_coleta",
    "nota_mobilizacao",
    "nps",
  ]);
  const longo = validarPesquisa({ ...pesquisaCompleta(), detalhes: { atendimento: "x".repeat(301) } }, ids);
  assert.ok(longo.erros.detalhe_atendimento);
  assert.equal(notaBaixa(2), true);
  assert.equal(notaBaixa(3), false);
  assert.equal(notaBaixa("nao_sei"), false);
});

test("uma resposta por celular por mês (horário de Brasília)", () => {
  assert.equal(mesDeReferencia(new Date("2026-11-30T12:00:00Z")), "2026-11");
  assert.equal(mesDeReferencia(new Date("2026-12-01T02:00:00Z")), "2026-11"); // ainda 30/11 em Brasília
  assert.equal(jaRespondeuNoMes("2026-11", new Date("2026-11-11T12:00:00Z")), true);
  assert.equal(jaRespondeuNoMes("2026-10", new Date("2026-11-11T12:00:00Z")), false);
  assert.equal(jaRespondeuNoMes(null), false);
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

test("coleta de podas: só no condomínio que tem dia de poda", () => {
  const mirante = { id: "m", nome: "M", dias: [2, 4], diasPoda: [1], horario: "14:00" };
  assert.deepEqual(coletasDoDia(mirante, TERCA_0630_BRASILIA), ["reciclaveis"]);
  assert.deepEqual(coletasDoDia(mirante, new Date("2026-11-16T09:30:00Z")), ["podas"]); // segunda
  assert.deepEqual(coletasDoDia(manha, TERCA_0630_BRASILIA), ["reciclaveis"]); // sem diasPoda = só recicláveis
  assert.equal(proximaPoda(manha, TERCA_0630_BRASILIA), null);

  assert.equal(rotuloDaColeta(proximaPoda(mirante, TERCA_0630_BRASILIA)), "Segunda-feira, 16/11");

  const datas = proximasColetasComTipo(mirante, TERCA_0630_BRASILIA, 4);
  assert.deepEqual(
    datas.map((d) => [d.dia, d.tipos]),
    [
      [10, ["reciclaveis"]],
      [12, ["reciclaveis"]],
      [16, ["podas"]],
      [17, ["reciclaveis"]],
    ],
  );
  assert.equal(conferirCondominios([{ ...mirante, diasPoda: [8] }]).length, 1);
});

test("horário 10h: aceito no app e no banco (SQL 015), com o mesmo texto", async () => {
  const { readFileSync } = await import("node:fs");
  const { HORARIOS_VALIDOS, periodoDoHorario } = await import("../src/lib/coleta.js");
  const sql = readFileSync(new URL("../supabase/015_horario_10h.sql", import.meta.url), "utf8");
  const doBanco = sql.match(/check \(horario in \(([^)]*)\)\)/)[1].match(/\d\d:\d\d/g);
  assert.deepEqual(doBanco, HORARIOS_VALIDOS);
  assert.ok(HORARIOS_VALIDOS.includes("10:00"));
  assert.equal(formatarHorario("10:00"), "10h");
  assert.equal(periodoDoHorario("10:00"), "manhã");
  assert.equal(textoLembrete("10:00"), "Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às 10h.");
  assert.deepEqual(conferirCondominios([{ id: "sf", nome: "SF", dias: [3], horario: "10:00" }]), []);
  assert.equal(conferirCondominios([{ id: "sf", nome: "SF", dias: [3], horario: "11:00" }]).length, 1);
});

test("WhatsApp do morador: diz que veio do app e de qual condomínio", async () => {
  const { mensagemDoMorador, linkWhatsapp } = await import("../src/data/contatos.js");
  const sf = { id: "condominio-san-francisco-ii", nome: "Condomínio San Francisco II" };
  assert.equal(mensagemDoMorador(sf), "Olá! Vim pelo app da Ecolimpo. Sou do Condomínio San Francisco II.");
  assert.equal(
    mensagemDoMorador(sf, "Tenho uma dúvida sobre a separação dos recicláveis."),
    "Olá! Vim pelo app da Ecolimpo. Sou do Condomínio San Francisco II. Tenho uma dúvida sobre a separação dos recicláveis.",
  );
  // Sem condomínio escolhido: só diz que veio do app.
  assert.equal(mensagemDoMorador(null), "Olá! Vim pelo app da Ecolimpo.");
  // Acentos e espaços vão certos no link do WhatsApp.
  const link = linkWhatsapp(mensagemDoMorador(sf));
  assert.ok(link.startsWith("https://wa.me/5561982372013?text="));
  assert.equal(decodeURIComponent(link.split("text=")[1]), mensagemDoMorador(sf));
  // As duas telas usam a mensagem nova.
  const { readFileSync } = await import("node:fs");
  for (const tela of ["Fale.jsx", "Recicla.jsx"])
    assert.match(readFileSync(new URL(`../src/pages/${tela}`, import.meta.url), "utf8"), /mensagemDoMorador\(condominio/);
});
