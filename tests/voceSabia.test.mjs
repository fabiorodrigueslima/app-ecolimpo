import { test } from "node:test";
import assert from "node:assert/strict";

import { paises, depoimento } from "../src/data/reciclagemMundo.js";
import {
  formatarPorcentagem,
  ordenarPaises,
  frasesDoQuadro,
  fontesUnicas,
  depoimentoPreenchido,
} from "../src/lib/voceSabia.js";

test("porcentagem no jeito brasileiro", () => {
  assert.equal(formatarPorcentagem(8.7), "8,7%");
  assert.equal(formatarPorcentagem(69), "69%");
  assert.equal(formatarPorcentagem(60.7), "60,7%");
});

test("arquivo dos países: todo número tem ano e fonte com link", () => {
  assert.ok(paises.length >= 2);
  assert.equal(paises.filter((p) => p.destaque).length, 1, "só o Brasil fica em destaque");
  for (const p of paises) {
    assert.ok(p.nome, "falta nome");
    assert.ok(p.porcentagem > 0 && p.porcentagem <= 100, `${p.nome}: porcentagem inválida`);
    assert.ok(Number.isInteger(p.ano) && p.ano >= 2015, `${p.nome}: ano inválido`);
    assert.ok(p.fonte, `${p.nome}: falta fonte`);
    assert.match(p.link, /^https:\/\//, `${p.nome}: link da fonte inválido`);
  }
});

test("frases do quadro saem dos números", () => {
  const frases = frasesDoQuadro([
    { nome: "Brasil", porcentagem: 8.7, destaque: true },
    { nome: "Áustria", porcentagem: 60.7 },
    { nome: "Alemanha", porcentagem: 69 },
  ]);
  assert.deepEqual(frases, {
    titulo: "O Brasil recicla só 8,7% do lixo das cidades.",
    comparacao: "Na Alemanha, chega a 69%.",
  });
  assert.equal(frasesDoQuadro([{ nome: "Brasil", porcentagem: 8.7, destaque: true }]), null);
});

test("países do maior para o menor e fontes sem repetir", () => {
  assert.deepEqual(
    ordenarPaises(paises).map((p) => p.nome),
    ["Alemanha", "Áustria", "Coreia do Sul", "Brasil"],
  );
  const fontes = fontesUnicas(paises);
  assert.equal(fontes.length, 3); // Eurostat aparece uma vez só
  assert.equal(fontes[0].anos, "2024");
});

test("frase do catador fica escondida até ser preenchida", () => {
  assert.equal(depoimentoPreenchido({ texto: "A PREENCHER" }), false);
  assert.equal(depoimentoPreenchido({ texto: "" }), false);
  assert.equal(depoimentoPreenchido({ texto: "Separar o lixo é dar valor ao nosso trabalho." }), true);
  assert.equal(depoimentoPreenchido(depoimento), false); // ainda não chegou
});

test("sem a frase do catador, aparece a mensagem da Cooperativa (sem A PREENCHER)", async () => {
  const { mensagemDaCooperativa } = await import("../src/data/reciclagemMundo.js");
  assert.ok(mensagemDaCooperativa.texto.length > 20);
  assert.doesNotMatch(mensagemDaCooperativa.texto + mensagemDaCooperativa.autor, /A PREENCHER/);
  assert.equal(mensagemDaCooperativa.autor, "Cooperativa Ecolimpo");
});
