import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Armazenamento falso do navegador (o Node não tem).
function armazem() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), clear: () => m.clear() };
}
globalThis.localStorage = armazem();
globalThis.sessionStorage = armazem();

const { contar, contarAbertura, lugarDe, marcarAparelhoDaEquipe, TIPOS } = await import("../src/lib/contagem.js");
const { somarContagens, resumoDoUso, inicioDoPeriodo } = await import("../src/painel/regras.js");

let enviados;
const enviar = (args) => enviados.push(args);
const esperar = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  enviados = [];
  localStorage.clear();
  sessionStorage.clear();
  delete globalThis.navigator;
});

test("contagem manda só tipo e lugar (nada pessoal)", async () => {
  contar("whatsapp", { id: "condominio-san-francisco-ii", nome: "Condomínio San Francisco II", dias: [3] }, { enviar });
  await esperar();
  assert.deepEqual(enviados, [{ p_tipo: "whatsapp", p_local: "condominio-san-francisco-ii" }]);
  assert.deepEqual(Object.keys(enviados[0]).sort(), ["p_local", "p_tipo"]);
});

test("lugar: condomínio, bairro ou vazio", () => {
  assert.equal(lugarDe(null), "");
  assert.equal(lugarDe({ id: "condominio-mônaco" }), "condominio-mônaco");
  assert.equal(lugarDe({ tipo: "bairro", id: "sao-jose" }), "bairro:sao-jose");
  assert.equal(lugarDe("condominio-x"), "condominio-x");
});

test("tipo desconhecido não é enviado", async () => {
  assert.equal(contar("clique-qualquer", "", { enviar }), false);
  await esperar();
  assert.equal(enviados.length, 0);
});

test("abertura conta 1 vez por visita; QR junto", async () => {
  const local = { id: "condominio-mônaco" };
  assert.deepEqual(contarAbertura({ local, veioDoQr: "condominio-mônaco" }, { enviar }), ["abertura", "qr"]);
  assert.deepEqual(contarAbertura({ local }, { enviar }), []); // mesma visita: não conta de novo
  await esperar();
  assert.deepEqual(
    enviados.map((e) => e.p_tipo),
    ["abertura", "qr"],
  );
});

test("instalação conta 1 vez quando abre pelo ícone", async () => {
  globalThis.navigator = { standalone: true }; // iPhone aberto pelo ícone da tela inicial
  assert.deepEqual(contarAbertura({ local: { id: "a" } }, { enviar }), ["abertura", "instalacao"]);
  sessionStorage.clear(); // nova visita
  assert.deepEqual(contarAbertura({ local: { id: "a" } }, { enviar }), ["abertura"]);
});

test("celular da equipe (entrou no painel) não é contado", async () => {
  marcarAparelhoDaEquipe();
  assert.equal(contar("abertura", "", { enviar }), false);
  assert.deepEqual(contarAbertura({}, { enviar }), []);
  await esperar();
  assert.equal(enviados.length, 0);
});

test("tipos do app = tipos aceitos pelo banco (SQL 017)", () => {
  const sql = readFileSync(new URL("../supabase/017_contagens_uso.sql", import.meta.url), "utf8");
  const listas = [...sql.matchAll(/tipo in \(([^)]+)\)|p_tipo not in \(([^)]+)\)/g)].map((m) =>
    (m[1] ?? m[2]).match(/'([a-z_]+)'/g).map((s) => s.replaceAll("'", "")),
  );
  assert.equal(listas.length, 2);
  for (const lista of listas) assert.deepEqual([...lista].sort(), [...TIPOS].sort());
  // Política de privacidade diz 2 anos = limpeza do SQL (730 dias).
  assert.match(sql, /- 730;/);
  assert.match(readFileSync(new URL("../src/pages/Privacidade.jsx", import.meta.url), "utf8"), /Contagem de uso[^<]*2 anos/);
  // A tabela não guarda nada pessoal: só dia, tipo, local e total.
  const colunas = sql.match(/create table if not exists public\.contagens \(([\s\S]*?)\n\);/)[1];
  const nomes = colunas.split("\n").map((l) => l.trim().split(/\s+/)[0]).filter((n) => /^[a-z]+$/.test(n));
  assert.deepEqual(nomes.filter((n) => n !== "primary"), ["dia", "tipo", "local", "total"]);
});

test("painel: soma por lugar e texto do cartão", () => {
  const uso = somarContagens([
    { tipo: "abertura", local: "condominio-san-francisco-ii", total: 3 },
    { tipo: "abertura", local: "condominio-san-francisco-ii", total: 2 }, // outro dia
    { tipo: "whatsapp", local: "condominio-san-francisco-ii", total: 1 },
    { tipo: "abertura", local: "", total: 4 },
  ]);
  assert.equal(uso["condominio-san-francisco-ii"].abertura, 5);
  assert.equal(uso[""].abertura, 4);
  assert.equal(
    resumoDoUso(uso["condominio-san-francisco-ii"]),
    "5 aberturas · 0 instalações · 0 pelo QR Code · 1 no WhatsApp",
  );
  assert.equal(resumoDoUso(undefined), "0 aberturas · 0 instalações · 0 pelo QR Code · 0 no WhatsApp");
  assert.equal(resumoDoUso({ abertura: 1, instalacao: 1 }).slice(0, 26), "1 abertura · 1 instalação ");
});

test("período: últimos N dias contando hoje, no horário de Brasília", () => {
  // 27/11 às 01h em Brasília (= 04h UTC)
  const agora = new Date("2026-11-27T04:00:00Z");
  assert.equal(inicioDoPeriodo(1, agora), "2026-11-27");
  assert.equal(inicioDoPeriodo(7, agora), "2026-11-21");
  assert.equal(inicioDoPeriodo(30, agora), "2026-10-29");
  // 27/11 às 23h em Brasília já é 28/11 em UTC: continua 27/11.
  assert.equal(inicioDoPeriodo(1, new Date("2026-11-28T02:00:00Z")), "2026-11-27");
});

test("painel: tabela dos bairros (casas) com 'não está na lista' e total", async () => {
  const { tabelaDosBairros, COLUNAS_BAIRROS } = await import("../src/painel/regras.js");
  const { escolhasDaLista } = await import("../src/lib/circuitos.js");
  const uso = somarContagens([
    { tipo: "abertura", local: "bairro:sao-jose", total: 5 },
    { tipo: "escolha_bairro", local: "bairro:sao-jose", total: 2 },
    { tipo: "ouvidoria", local: "bairro:sao-jose", total: 3 },
    { tipo: "fora_da_lista", local: "bairro:fora-da-lista", total: 4 },
    { tipo: "ouvidoria", local: "bairro:fora-da-lista", total: 1 },
    { tipo: "abertura", local: "condominio-san-francisco-ii", total: 9 }, // condomínio não entra
  ]);
  const { linhas, total } = tabelaDosBairros(uso, escolhasDaLista());
  assert.equal(linhas.length, escolhasDaLista().length + 1);
  const saoJose = linhas.find((l) => l.id === "sao-jose");
  assert.deepEqual(
    { nome: saoJose.nome, abertura: saoJose.abertura, escolha: saoJose.escolha_bairro, ouvidoria: saoJose.ouvidoria },
    { nome: "Bairro São José", abertura: 5, escolha: 2, ouvidoria: 3 },
  );
  const fora = linhas.at(-1);
  assert.equal(fora.nome, "Meu bairro não está na lista");
  assert.equal(fora.escolha_bairro, 4); // quantos escolheram "não está na lista"
  assert.equal(fora.ouvidoria, 1);
  assert.deepEqual(
    Object.fromEntries(COLUNAS_BAIRROS.map((c) => [c.tipo, total[c.tipo]])),
    { abertura: 5, escolha_bairro: 6, ouvidoria: 4, mapa_slu: 0, whatsapp: 0 },
  );
});
