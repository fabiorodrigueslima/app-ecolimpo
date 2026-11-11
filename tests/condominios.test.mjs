import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  filtrarCondominios,
  termoValido,
  buscarCondominios,
  condominioPorId,
  MINIMO_LETRAS,
  MAXIMO_RESULTADOS,
} from "../src/lib/condominios.js";
import { normalizar } from "../src/lib/busca.js";

const lista = [
  { id: "mirante", nome: "CONDOMÍNIO ECOLÓGICO PARQUE DO MIRANTE", dias: [1], horario: "14:00" },
  { id: "monaco", nome: "CONDOMÍNIO PRIVE MONACO", dias: [2], horario: "09:00" },
  { id: "sf2", nome: "CONDOMÍNIO SAN FRANCISCO II", dias: [3], horario: "14:00" },
  { id: "sf3", nome: "CONDOMÍNIO SAN FRANCISCO III", dias: [4], horario: "09:00" },
  { id: "jardim", nome: "Jardim São Francisco", dias: [5], horario: "09:00" },
];

test("só busca com pelo menos 4 letras (ninguém lista todos digitando 'a')", () => {
  assert.equal(MINIMO_LETRAS, 4);
  assert.equal(termoValido("mir"), false);
  assert.equal(termoValido("  mi  "), false);
  assert.equal(termoValido("mira"), true);
  assert.deepEqual(filtrarCondominios(lista, "con"), []);
  assert.deepEqual(filtrarCondominios(lista, ""), []);
});

test("mostra só os condomínios que combinam, sem ligar para acentos", () => {
  assert.deepEqual(filtrarCondominios(lista, "mirante").map((c) => c.id), ["mirante"]);
  assert.deepEqual(filtrarCondominios(lista, "MÔNACO").map((c) => c.id), ["monaco"]);
  assert.deepEqual(filtrarCondominios(lista, "ecologico").map((c) => c.id), ["mirante"]);
  assert.deepEqual(filtrarCondominios(lista, "xyzw"), []);
});

test("no máximo 3 resultados, mesmo quando muitos combinam", () => {
  assert.equal(MAXIMO_RESULTADOS, 3);
  const r = filtrarCondominios(lista, "cond");
  assert.equal(r.length, 3);
  assert.equal(filtrarCondominios(lista, "francisco").length, 3);
});

test("modo de teste (sem banco): busca e QR Code usam o arquivo de exemplo", async () => {
  const busca = await buscarCondominios("exemplo");
  assert.equal(busca.ok, true);
  assert.ok(busca.lista.length >= 1 && busca.lista.length <= 3);
  assert.deepEqual(await buscarCondominios("exe"), { ok: true, lista: [] });
  const qr = await condominioPorId("exemplo-manha");
  assert.equal(qr.condominio.id, "exemplo-manha");
  assert.equal((await condominioPorId("nao-existe")).condominio, null);
});

test("o banco (SQL 010) segue as mesmas regras do app", () => {
  const sql = readFileSync(new URL("../supabase/010_condominio_privado.sql", import.meta.url), "utf8");
  assert.match(sql, new RegExp(`char_length\\(termo\\) < ${MINIMO_LETRAS}`));
  assert.match(sql, new RegExp(`limit ${MAXIMO_RESULTADOS};`));
  assert.match(sql, /revoke select on public\.condominios from anon/);
});

test("o banco troca acentos MINÚSCULOS e MAIÚSCULOS igual ao app (SQL 011)", () => {
  // No Supabase, lower() não mexe em letra acentuada: "Ó" continua "Ó".
  // Por isso a troca do banco precisa ter as maiúsculas também.
  const sql = readFileSync(new URL("../supabase/011_busca_acentos.sql", import.meta.url), "utf8");
  const [, de, para] = sql.match(/translate\(lower\(coalesce\(t, ''\)\),\s*'([^']+)',\s*'([^']+)'\)/);
  assert.equal([...de].length, [...para].length);
  [...de].forEach((letra, i) => assert.equal(normalizar(letra), [...para][i], `letra ${letra}`));
  for (const letra of "ÁÉÍÓÚÂÊÔÃÕÇ") assert.ok(de.includes(letra), `falta a maiúscula ${letra}`);
  for (const letra of "áéíóúâêôãõç") assert.ok(de.includes(letra), `falta a minúscula ${letra}`);
});
