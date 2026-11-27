import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  lerMoradia,
  salvarMoradia,
  casaDaMoradia,
  localDaCasa,
  nomeDaCasa,
  FORA_DA_LISTA,
} from "../src/lib/moradia.js";
import { mensagemDoMorador } from "../src/data/contatos.js";
import { lugarDe } from "../src/lib/contagem.js";

function armazem() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test("moradia fica salva só no celular (casa, fora da lista ou condomínio)", () => {
  const a = armazem();
  assert.equal(lerMoradia(a), null); // quem já usava o app com condomínio: nada muda
  salvarMoradia({ tipo: "casa", area: "sao-jose" }, a);
  assert.deepEqual(lerMoradia(a), { tipo: "casa", area: "sao-jose" });
  salvarMoradia({ tipo: "condominio" }, a);
  assert.deepEqual(lerMoradia(a), { tipo: "condominio" });
  a.setItem("ecolimpo:moradia", "lixo{");
  assert.equal(lerMoradia(a), null);
  a.setItem("ecolimpo:moradia", JSON.stringify({ tipo: "outra-coisa" }));
  assert.equal(lerMoradia(a), null);
});

test("casa: acha a área no arquivo; área que saiu da lista pede para escolher de novo", () => {
  const casa = casaDaMoradia({ tipo: "casa", area: "residencial-oeste-201-206" });
  assert.equal(nomeDaCasa(casa), "Residencial Oeste — Quadras 201 até 206");
  assert.deepEqual(casa.escolha.circuitos, ["403205"]);
  assert.equal(casaDaMoradia({ tipo: "casa", area: "bairro-que-saiu" }), null);
  assert.equal(casaDaMoradia({ tipo: "condominio" }), null);
  assert.deepEqual(casaDaMoradia({ tipo: "casa", foraDaLista: true }), { tipo: "casa", foraDaLista: true });
});

test("contadores das casas usam bairro:<id> (aceito pelo SQL 017)", () => {
  const casa = casaDaMoradia({ tipo: "casa", area: "sao-jose" });
  assert.equal(lugarDe(localDaCasa(casa)), "bairro:sao-jose");
  assert.equal(lugarDe(localDaCasa({ tipo: "casa", foraDaLista: true })), `bairro:${FORA_DA_LISTA}`);
  assert.match(lugarDe(localDaCasa(casa)), /^bairro:[a-z0-9-]{1,60}$/);
});

test("WhatsApp de quem mora em casa diz o bairro (ou que está fora da lista)", () => {
  const casa = casaDaMoradia({ tipo: "casa", area: "residencial-oeste-101-104" });
  assert.equal(
    mensagemDoMorador(casa),
    "Olá! Vim pelo app da Ecolimpo. Moro em casa: Residencial Oeste — Quadras 101 até 104 (São Sebastião).",
  );
  assert.equal(
    mensagemDoMorador({ tipo: "casa", foraDaLista: true }),
    "Olá! Vim pelo app da Ecolimpo. Moro em casa, numa área que não está na lista do app.",
  );
  // Condomínio continua igual.
  assert.equal(
    mensagemDoMorador({ nome: "Condomínio Mônaco" }),
    "Olá! Vim pelo app da Ecolimpo. Sou do Condomínio Mônaco.",
  );
});

test("telas das casas: textos e botões pedidos, com nome para leitor de tela", () => {
  const ajuda = readFileSync(new URL("../src/components/AjudaSlu.jsx", import.meta.url), "utf8");
  assert.match(ajuda, /A rota é definida pelo SLU/);
  assert.match(ajuda, /href=\{SLU\.ouvidoriaLink\}/);
  assert.equal((ajuda.match(/aria-label=/g) ?? []).length, 3);
  for (const tipo of ["ouvidoria", "whatsapp", "mapa_slu"]) assert.match(ajuda, new RegExp(`contar\\("${tipo}"`));
  const slu = readFileSync(new URL("../src/data/circuitosSlu.js", import.meta.url), "utf8");
  assert.match(slu, /ouvidoriaLink: "tel:162"/);
  assert.match(
    slu,
    /sigportal\.slu\.df\.gov\.br\/arcgis\/apps\/webappviewer\/index\.html\?id=6854430f522546f990c08850191ff824/,
  );
  const casa = readFileSync(new URL("../src/pages/Casa.jsx", import.meta.url), "utf8");
  assert.match(casa, /Sua área pode ser atendida por outra cooperativa ou ainda não ter coleta seletiva/);
  const cartao = readFileSync(new URL("../src/components/ColetaCasa.jsx", import.meta.url), "utf8");
  assert.match(cartao, /Coloque o material na calçada antes do horário da coleta/);
  assert.match(cartao, /Fonte: \{SLU\.nome\}/);
});
