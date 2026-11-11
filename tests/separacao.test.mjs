import { test } from "node:test";
import assert from "node:assert/strict";

import { reciclaveis, naoReciclaveis, ICONES_DOS_ITENS } from "../src/data/separacao.js";

test("guia de separação tem os itens enviados pela cooperativa", () => {
  assert.deepEqual(
    reciclaveis.itens.map((i) => i.nome),
    ["Papel", "Papelão", "Plástico", "Vidro", "Metal", "EPS (Isopor)", "Embalagem longa vida"],
  );
  assert.deepEqual(
    naoReciclaveis.itens.map((i) => i.nome),
    ["Restos de alimentos", "Borra de café", "Fralda descartável", "Papéis engordurados", "Lixo de banheiro", "Tecidos rasgados"],
  );
});

test("cada item tem um ícone que existe e nenhum item se repete", () => {
  const todos = [...reciclaveis.itens, ...naoReciclaveis.itens];
  for (const item of todos) assert.ok(ICONES_DOS_ITENS.includes(item.icone), `${item.nome}: ícone "${item.icone}" não existe`);
  assert.equal(new Set(todos.map((i) => i.nome)).size, todos.length);
});
