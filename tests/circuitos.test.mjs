import { test } from "node:test";
import assert from "node:assert/strict";

import {
  conferirCircuitos,
  escolhaPorId,
  escolhasDaLista,
  areasPorGrupo,
  descreverColetas,
  textoCircuitos,
  proximaColetaDe,
  proximasColetasDe,
  rotuloDaProxima,
  minutosEmBrasilia,
} from "../src/lib/circuitos.js";
import { AREAS, TURNOS, CONFERIDO_EM } from "../src/data/circuitosSlu.js";

// Horário de Brasília (UTC-3): "2026-11-27 15:00" -> Date
const brasilia = (dataHora) => new Date(`${dataHora.replace(" ", "T")}:00-03:00`);
// 27/11/2026 = sexta | 28 = sábado | 29 = domingo | 30 = segunda | 01/12 = terça | 03/12 = quinta
const proxima = (id, quando) => rotuloDaProxima(proximaColetaDe(escolhaPorId(id), brasilia(quando)));

test("arquivo dos circuitos está certo (sem erros)", () => {
  assert.deepEqual(conferirCircuitos(), []);
  // Data da conferência no mapa do SLU: vazia ou uma data de verdade (AAAA-MM-DD).
  assert.ok(CONFERIDO_EM === "" || !Number.isNaN(new Date(`${CONFERIDO_EM}T12:00:00Z`).getTime()));
  assert.match(CONFERIDO_EM, /^(|\d{4}-\d{2}-\d{2})$/);
});

test("todas as áreas do pedido estão na lista, com o circuito certo", () => {
  const circuito = (id) => escolhaPorId(id)?.circuitos;
  for (const id of ["jardins-mangueiral", "jardim-botanico-iii", "av-marginal-df-001"]) assert.deepEqual(circuito(id), ["403201"]);
  for (const id of ["sao-jose", "sao-francisco", "centro"]) assert.deepEqual(circuito(id), ["403202", "403203"]);
  for (const id of ["vila-nova-ruas-12-54", "bela-vista", "residencial-do-bosque"]) assert.deepEqual(circuito(id), ["403204"]);
  for (const id of ["avenida-sao-sebastiao", "residencial-oeste-201-206", "residencial-oeste-301-307"])
    assert.deepEqual(circuito(id), ["403205"]);
  for (const id of ["avenida-comercial", "sao-bartolomeu-quadras-1-2", "tradicional", "residencial-oeste-101-104", "ruas-12-13-14-15a-16", "morro-azul"])
    assert.deepEqual(circuito(id), ["403206"]);
  assert.equal(escolhasDaLista().length, 18); // 3 (Mangueiral/Jd. Botânico) + 15 (São Sebastião, com as partes)
});

test("bairros divididos: o morador escolhe a parte; fora dela = 'não está na lista'", () => {
  const partes = (id) => AREAS.find((a) => a.id === id).partes.map((p) => p.id);
  assert.deepEqual(partes("residencial-oeste"), ["residencial-oeste-101-104", "residencial-oeste-201-206", "residencial-oeste-301-307"]);
  assert.deepEqual(partes("vila-nova"), ["vila-nova-ruas-12-54"]); // outras ruas: não está na lista
  assert.deepEqual(partes("sao-bartolomeu"), ["sao-bartolomeu-quadras-1-2"]); // outras quadras: não está na lista
  // O bairro dividido sozinho não é uma escolha final (precisa da quadra/rua).
  assert.equal(escolhaPorId("residencial-oeste"), null);
  assert.equal(escolhaPorId("nao-existe"), null);
  // Ruas 12, 13, 14, 15A e 16 são do Setor Tradicional (inteiro, sem escolher rua), não do Residencial Oeste.
  assert.equal(escolhaPorId("tradicional").nome, "Setor Tradicional");
  assert.equal(AREAS.find((a) => a.id === "tradicional").partes, undefined);
  assert.equal(escolhaPorId("residencial-oeste-101-104").nome, "Quadras 101 até 104");
  assert.equal(descreverColetas(escolhaPorId("residencial-oeste-101-104")), "Segunda e quarta, à tarde (13h às 18h)");
  assert.equal(descreverColetas(escolhaPorId("residencial-oeste-201-206")), "Terça e quinta, à tarde (13h às 18h)");
});

test("grupos da lista: Jardins Mangueiral/Jardim Botânico e São Sebastião", () => {
  assert.deepEqual(
    areasPorGrupo().map((g) => g.grupo),
    ["Jardins Mangueiral e Jardim Botânico", "São Sebastião"],
  );
});

test("texto dos dias e turnos", () => {
  assert.equal(descreverColetas(escolhaPorId("sao-jose")), "Terça de manhã (8h às 12h) e sexta à tarde (13h às 18h)");
  assert.equal(descreverColetas(escolhaPorId("jardins-mangueiral")), "Segunda e quinta, de manhã (8h às 12h)");
  assert.equal(descreverColetas(escolhaPorId("morro-azul")), "Segunda e quarta, à tarde (13h às 18h)");
  assert.equal(textoCircuitos(escolhaPorId("sao-jose")), "Circuitos 403202 / 403203");
  assert.equal(textoCircuitos(escolhaPorId("bela-vista")), "Circuito 403204");
});

test("próxima coleta — São José (terça manhã e sexta tarde)", () => {
  assert.equal(proxima("sao-jose", "2026-11-27 10:00"), "Hoje, à tarde (13h às 18h)"); // sexta antes da tarde
  assert.equal(proxima("sao-jose", "2026-11-27 15:00"), "Agora, à tarde (13h às 18h)"); // sexta durante a coleta
  assert.equal(proxima("sao-jose", "2026-11-27 18:00"), "Terça-feira, 01/12, de manhã (8h às 12h)"); // sexta depois
  assert.equal(proxima("sao-jose", "2026-11-28 09:00"), "Terça-feira, 01/12, de manhã (8h às 12h)"); // sábado
  assert.equal(proxima("sao-jose", "2026-11-29 20:00"), "Terça-feira, 01/12, de manhã (8h às 12h)"); // domingo
  assert.equal(proxima("sao-jose", "2026-11-30 07:00"), "Amanhã, terça, de manhã (8h às 12h)"); // segunda
});

test("próxima coleta — segunda e quinta de manhã (sexta à tarde, sábado e domingo vão para segunda)", () => {
  assert.equal(proxima("jardins-mangueiral", "2026-11-27 15:00"), "Segunda-feira, 30/11, de manhã (8h às 12h)");
  assert.equal(proxima("jardins-mangueiral", "2026-11-28 10:00"), "Segunda-feira, 30/11, de manhã (8h às 12h)");
  assert.equal(proxima("jardins-mangueiral", "2026-11-29 22:00"), "Amanhã, segunda, de manhã (8h às 12h)");
  assert.equal(proxima("jardins-mangueiral", "2026-11-30 07:59"), "Hoje, de manhã (8h às 12h)");
  assert.equal(proxima("jardins-mangueiral", "2026-11-30 08:00"), "Agora, de manhã (8h às 12h)");
  assert.equal(proxima("jardins-mangueiral", "2026-11-30 12:00"), "Quinta-feira, 03/12, de manhã (8h às 12h)"); // turno acabou
});

test("fuso de Brasília: quinta 23h30 em Brasília já é sexta em UTC", () => {
  const quintaNoite = brasilia("2026-12-03 23:30");
  assert.equal(quintaNoite.getUTCDay(), 5); // em UTC já é sexta
  assert.equal(minutosEmBrasilia(quintaNoite), 23 * 60 + 30);
  assert.equal(rotuloDaProxima(proximaColetaDe(escolhaPorId("bela-vista"), quintaNoite)), "Amanhã, sexta, de manhã (8h às 12h)");
});

test("toda área, a cada hora da semana: sempre acha a próxima, nunca no fim de semana, nunca turno já acabado", () => {
  const minutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
  for (const e of escolhasDaLista()) {
    for (let h = 0; h < 7 * 24; h++) {
      const agora = new Date(brasilia("2026-11-27 00:00").getTime() + h * 3600 * 1000);
      const p = proximaColetaDe(e, agora);
      assert.ok(p, `${e.id} sem próxima coleta`);
      assert.ok(p.diaSemana >= 1 && p.diaSemana <= 5, `${e.id}: coleta no fim de semana`);
      assert.ok(p.diasAte <= 7, `${e.id}: próxima coleta longe demais`);
      if (p.diasAte === 0) assert.ok(minutosEmBrasilia(agora) < minutos(TURNOS[p.turno].fim), `${e.id}: turno já acabou`);
    }
  }
});

test("lista das próximas datas sai em ordem", () => {
  const lista = proximasColetasDe(escolhaPorId("sao-jose"), brasilia("2026-11-27 10:00"), 4);
  assert.deepEqual(
    lista.map((c) => `${c.dia}/${c.mes} ${c.turno}`),
    ["27/11 tarde", "1/12 manha", "4/12 tarde", "8/12 manha"],
  );
});

test("circuito 403206 = exatamente a lista do SLU; ruas 12 a 16 separadas da Vila Nova", () => {
  const do403206 = escolhasDaLista().filter((e) => e.circuitos.includes("403206")).map((e) => e.nomeCompleto);
  assert.deepEqual(do403206, [
    "Residencial Oeste — Quadras 101 até 104",
    "Avenida Comercial",
    "Bairro São Bartolomeu — Quadras 1 e 2",
    "Setor Tradicional",
    "Ruas 12, 13, 14, 15A e 16",
    "Morro Azul",
  ]);
  assert.equal(descreverColetas(escolhaPorId("ruas-12-13-14-15a-16")), "Segunda e quarta, à tarde (13h às 18h)");
  // Vila Nova (ruas 12 até 54) continua no 403204: quarta e sexta de manhã.
  assert.deepEqual(escolhaPorId("vila-nova-ruas-12-54").circuitos, ["403204"]);
  assert.equal(descreverColetas(escolhaPorId("vila-nova-ruas-12-54")), "Quarta e sexta, de manhã (8h às 12h)");
});

test("ids das áreas servem para os contadores (bairro:<id> aceito pelo SQL 017)", () => {
  for (const e of escolhasDaLista()) assert.match(`bairro:${e.id}`, /^bairro:[a-z0-9-]{1,60}$/);
});
