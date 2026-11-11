import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { privacidade } from "../src/data/privacidade.js";

test("política de privacidade está toda preenchida", () => {
  for (const [campo, valor] of Object.entries(privacidade)) {
    assert.doesNotMatch(String(valor), /A PREENCHER/, `campo "${campo}" ainda está A PREENCHER`);
  }
  assert.match(privacidade.atualizadaEm, /^\d{2}\/\d{2}\/\d{4}$/);
});

test("o prazo da política é o mesmo da limpeza automática do banco", () => {
  const sql = readFileSync(new URL("../supabase/007_limpeza_automatica.sql", import.meta.url), "utf8");
  const meses = Number(sql.match(/interval '(\d+) months'/)[1]);
  assert.equal(meses, privacidade.prazoMeses);
  assert.equal(privacidade.prazoRespostas, `${privacidade.prazoMeses} meses`);
});
