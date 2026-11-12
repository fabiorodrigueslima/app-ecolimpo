import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  hojeISO,
  dataCurta,
  rotuloDataAviso,
  textoModeloAviso,
  validarAviso,
  linhaDoAviso,
  mensagemDoAviso,
  TEXTO_MAXIMO,
} from "../src/lib/avisos.js";
import { enviarLembretesDoDia, mensagensDoDia } from "../servidor/lembrete.js";
import { criarBancoServidor } from "../servidor/banco.js";

// 12/11/2026 é uma quinta-feira. 23h em Brasília já é dia 13 em UTC.
const QUINTA_1000 = new Date("2026-11-12T13:00:00Z");
const QUINTA_2300 = new Date("2026-11-13T02:00:00Z");
const SEXTA_0630 = new Date("2026-11-13T09:30:00Z");

test("datas dos avisos usam o horário de Brasília", () => {
  assert.equal(hojeISO(QUINTA_1000), "2026-11-12");
  assert.equal(hojeISO(QUINTA_2300), "2026-11-12");
  assert.equal(dataCurta("2026-11-14"), "14/11");
  assert.equal(rotuloDataAviso("2026-11-12", QUINTA_1000), "Hoje");
  assert.equal(rotuloDataAviso("2026-11-13", QUINTA_2300), "Amanhã");
  assert.equal(rotuloDataAviso("2026-11-14", QUINTA_1000), "Sábado, 14/11");
  assert.equal(rotuloDataAviso("2027-01-04", QUINTA_1000), "Segunda-feira, 04/01");
});

test("texto do modelo de mobilização", () => {
  const texto = textoModeloAviso({ nome: " Condomínio San Francisco II ", data: "2026-11-14", inicio: "09:00", fim: "12:00" });
  assert.equal(
    texto,
    "Atenção, moradores do Condomínio San Francisco II! No dia 14/11, das 9h às 12h, nossos mobilizadores estarão " +
      "transitando pelo condomínio para tirar dúvidas sobre a Coleta Seletiva Inclusiva. Contamos com o seu apoio!",
  );
  assert.ok(texto.length <= TEXTO_MAXIMO);
  assert.doesNotMatch(textoModeloAviso({ nome: "X", data: "2026-11-14" }), /, das /); // sem horário
});

test("aviso: confere condomínio, data e texto", () => {
  const ok = { condominio_id: "sf", data: "2026-11-14", texto: "Mobilização no sábado de manhã." };
  assert.equal(validarAviso(ok, QUINTA_1000).ok, true);
  assert.equal(validarAviso({ ...ok, data: "2026-11-12" }, QUINTA_2300).ok, true); // hoje ainda vale
  assert.ok(validarAviso({ ...ok, data: "2026-11-11" }, QUINTA_1000).erros.data); // passou
  assert.ok(validarAviso({ ...ok, data: "" }, QUINTA_1000).erros.data);
  assert.ok(validarAviso({ ...ok, condominio_id: "" }, QUINTA_1000).erros.condominio_id);
  assert.ok(validarAviso({ ...ok, texto: "   curto  " }, QUINTA_1000).erros.texto);
  assert.ok(validarAviso({ ...ok, texto: "a".repeat(TEXTO_MAXIMO + 1) }, QUINTA_1000).erros.texto);
  assert.deepEqual(linhaDoAviso({ ...ok, texto: "  oi, tudo bem?  ", notificar: 1, extra: "x" }), {
    condominio_id: "sf",
    data: "2026-11-14",
    texto: "oi, tudo bem?",
    notificar: true,
  });
});

test("notificação do aviso tem etiqueta própria (não apaga o lembrete da coleta)", () => {
  assert.deepEqual(mensagemDoAviso({ id: 7, texto: "Oi" }), {
    titulo: "Aviso da Cooperativa Ecolimpo",
    corpo: "Oi",
    url: "/",
    tag: "aviso-7",
  });
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(sw, /tag: dados\.tag \|\| "lembrete-coleta"/);
});

const insc = (id, condominio) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/${id}`,
  p256dh: "chave-p256dh-de-teste-123456",
  auth: "auth-teste",
  condominio_id: condominio,
});

test("6h30: aviso vai para o condomínio dele, junto com o lembrete se tiver coleta", async () => {
  const condominios = [
    { id: "sf", nome: "SF", dias: [5], horario: "10:00" }, // sexta: tem coleta
    { id: "mo", nome: "MO", dias: [2], horario: "09:00" }, // sem coleta na sexta
    { id: "mi", nome: "MI", dias: [2], horario: "14:00" },
  ];
  const avisos = [
    { id: 1, condominio_id: "sf", texto: "Mobilização hoje no SF" },
    { id: 2, condominio_id: "mo", texto: "Mobilização hoje no Mônaco" },
    { id: 3, condominio_id: "inativo", texto: "Não deve sair" },
  ];
  assert.deepEqual([...mensagensDoDia(condominios, avisos, SEXTA_0630).keys()], ["sf", "mo"]);

  const enviados = [];
  const resumo = await enviarLembretesDoDia({
    agora: SEXTA_0630,
    condominios,
    avisos,
    buscarInscricoes: async (ids) => {
      assert.deepEqual(ids, ["sf", "mo"]); // "mi" não tem nada hoje
      return [insc("a", "sf"), insc("b", "mo")];
    },
    enviarPush: async (i, corpo) => enviados.push({ quem: i.endpoint.slice(-1), ...JSON.parse(corpo) }),
    apagarInscricao: async () => {},
  });
  assert.equal(resumo.enviados, 3);
  assert.deepEqual(
    enviados.map((e) => [e.quem, e.tag]).sort(),
    [
      ["a", "lembrete-coleta"],
      ["b", "aviso-2"],
      ["a", "aviso-1"],
    ].sort(),
  );
});

test("6h30: celular que desligou as notificações é apagado uma vez só", async () => {
  let apagados = 0;
  const resumo = await enviarLembretesDoDia({
    agora: SEXTA_0630,
    condominios: [{ id: "sf", nome: "SF", dias: [5], horario: "10:00" }],
    avisos: [{ id: 1, condominio_id: "sf", texto: "Mobilização hoje" }],
    buscarInscricoes: async () => [insc("a", "sf")],
    enviarPush: async () => {
      throw Object.assign(new Error("sumiu"), { statusCode: 410 });
    },
    apagarInscricao: async () => apagados++,
  });
  assert.equal(apagados, 1);
  assert.deepEqual([resumo.removidos, resumo.enviados, resumo.falhas], [1, 0, 0]);
});

test("servidor lê só os avisos do dia que pedem notificação", async () => {
  let endereco = "";
  const banco = criarBancoServidor({
    url: "https://x.supabase.co/",
    chave: "sb_secret_t",
    buscar: async (e) => {
      endereco = e;
      return { ok: true, json: async () => [{ id: 1, condominio_id: "sf", texto: "Oi" }] };
    },
  });
  assert.deepEqual(await banco.buscarAvisosDoDia("2026-11-14"), [{ id: 1, condominio_id: "sf", texto: "Oi" }]);
  assert.equal(
    endereco,
    "https://x.supabase.co/rest/v1/avisos?select=id,condominio_id,texto&data=eq.2026-11-14&notificar=is.true",
  );
});

test("SQL 016: app só lê avisos pela função; equipe publica; servidor lê; limite de texto igual ao app", () => {
  const sql = readFileSync(new URL("../supabase/016_avisos.sql", import.meta.url), "utf8");
  assert.match(sql, /revoke all on public\.avisos from anon, authenticated/);
  assert.match(sql, /grant execute on function public\.avisos_do_condominio\(text\) to anon, authenticated/);
  assert.match(sql, /grant select on public\.avisos to service_role/);
  assert.match(sql, /using \(public\.eh_equipe\(\)\)/);
  assert.match(sql, /and c\.ativo/);
  const [, min, max] = sql.match(/char_length\(texto\) between (\d+) and (\d+)/);
  assert.equal(Number(max), TEXTO_MAXIMO);
  assert.equal(Number(min), 10);
});
