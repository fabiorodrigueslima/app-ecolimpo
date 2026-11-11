import { test } from "node:test";
import assert from "node:assert/strict";

import {
  enviarLembretesDoDia,
  endpointConfiavel,
  pedidoAutorizado,
  mensagemDoLembrete,
} from "../servidor/lembrete.js";
import { criarBancoServidor } from "../servidor/banco.js";
import { avaliarAparelho, base64UrlParaBytes, argumentosInscricao } from "../src/lib/lembrete.js";
import { criarCliente } from "../src/lib/supabase.js";
import handler from "../api/lembrete.js";

const TERCA_0630 = new Date("2026-11-10T09:30:00Z"); // 6h30 em Brasília, terça-feira
const DOMINGO_0630 = new Date("2026-11-15T09:30:00Z");

const condominios = [
  { id: "manha", nome: "M", dias: [2], horario: "09:00" },
  { id: "tarde", nome: "T", dias: [2, 5], horario: "14:00" },
  { id: "quinta", nome: "Q", dias: [4], horario: "09:00" },
];

const insc = (id, condominio, host = "fcm.googleapis.com") => ({
  endpoint: `https://${host}/fcm/send/${id}`,
  p256dh: "chave-p256dh-de-teste-123456",
  auth: "auth-teste",
  condominio_id: condominio,
});

// ---------- Envio diário ----------

test("lembrete vai só para os condomínios com coleta hoje, com o horário certo", async () => {
  const pedidosAoBanco = [];
  const enviados = [];
  const resumo = await enviarLembretesDoDia({
    agora: TERCA_0630,
    condominios,
    buscarInscricoes: async (ids) => {
      pedidosAoBanco.push(ids);
      return [insc("1", "manha"), insc("2", "tarde")];
    },
    enviarPush: async (inscricao, corpo) => enviados.push({ endpoint: inscricao.endpoint, ...JSON.parse(corpo) }),
    apagarInscricao: async () => assert.fail("não deveria apagar"),
  });

  assert.deepEqual(pedidosAoBanco, [["manha", "tarde"]]); // "quinta" não entra
  assert.deepEqual(resumo, { condominios: ["manha", "tarde"], inscricoes: 2, enviados: 2, removidos: 0, falhas: 0, ignorados: 0 });
  assert.equal(enviados[0].corpo, "Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às 9h.");
  assert.equal(enviados[1].corpo, "Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às 14h.");
  assert.equal(enviados[0].url, "/coleta");
});

test("dia sem coleta: nem consulta o banco", async () => {
  const resumo = await enviarLembretesDoDia({
    agora: DOMINGO_0630,
    condominios,
    buscarInscricoes: async () => assert.fail("não deveria consultar"),
    enviarPush: async () => assert.fail("não deveria enviar"),
    apagarInscricao: async () => {},
  });
  assert.equal(resumo.enviados, 0);
  assert.deepEqual(resumo.condominios, []);
});

test("celular que desligou (410) é apagado; outros erros contam como falha; endereço estranho é ignorado", async () => {
  const apagados = [];
  const resumo = await enviarLembretesDoDia({
    agora: TERCA_0630,
    condominios,
    buscarInscricoes: async () => [
      insc("ok", "manha"),
      insc("saiu", "manha"),
      insc("caiu", "tarde"),
      insc("x", "manha", "site-qualquer.com"),
    ],
    enviarPush: async ({ endpoint }) => {
      if (endpoint.endsWith("saiu")) throw Object.assign(new Error("Gone"), { statusCode: 410 });
      if (endpoint.endsWith("caiu")) throw Object.assign(new Error("Erro"), { statusCode: 500 });
    },
    apagarInscricao: async (endpoint) => apagados.push(endpoint),
  });
  assert.deepEqual(apagados, ["https://fcm.googleapis.com/fcm/send/saiu"]);
  assert.deepEqual(
    { enviados: resumo.enviados, removidos: resumo.removidos, falhas: resumo.falhas, ignorados: resumo.ignorados },
    { enviados: 1, removidos: 1, falhas: 1, ignorados: 1 },
  );
});

test("só serviços de notificação conhecidos", () => {
  assert.equal(endpointConfiavel("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(endpointConfiavel("https://web.push.apple.com/QK"), true);
  assert.equal(endpointConfiavel("https://updates.push.services.mozilla.com/wpush/v2/x"), true);
  assert.equal(endpointConfiavel("https://wns2-bl2p.notify.windows.com/w/?token=1"), true);
  assert.equal(endpointConfiavel("http://fcm.googleapis.com/x"), false);
  assert.equal(endpointConfiavel("https://fcm.googleapis.com.golpe.com/x"), false);
  assert.equal(endpointConfiavel("nada"), false);
});

test("senha do despertador", () => {
  assert.equal(pedidoAutorizado("Bearer abc123", "abc123"), true);
  assert.equal(pedidoAutorizado("Bearer errada", "abc123"), false);
  assert.equal(pedidoAutorizado(undefined, "abc123"), false);
  assert.equal(pedidoAutorizado("Bearer ", ""), false);
});

test("mensagem da notificação", () => {
  assert.deepEqual(mensagemDoLembrete({ horario: "14:00" }), {
    titulo: "Hoje tem coleta seletiva",
    corpo: "Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às 14h.",
    url: "/coleta",
  });
});

// ---------- Função da Vercel (api/lembrete.js) ----------

function respostaFalsa() {
  return {
    codigo: 0,
    corpo: null,
    status(c) {
      this.codigo = c;
      return this;
    },
    json(c) {
      this.corpo = c;
      return this;
    },
  };
}

test("api/lembrete recusa quem não tem a senha e avisa variáveis faltando", async () => {
  const antes = { ...process.env };
  try {
    process.env.LEMBRETE_SEGREDO = "senha-certa";
    delete process.env.VAPID_PRIVATE_KEY;

    const semSenha = respostaFalsa();
    await handler({ method: "POST", headers: {} }, semSenha);
    assert.equal(semSenha.codigo, 401);

    const metodo = respostaFalsa();
    await handler({ method: "DELETE", headers: {} }, metodo);
    assert.equal(metodo.codigo, 405);

    const faltando = respostaFalsa();
    await handler({ method: "POST", headers: { authorization: "Bearer senha-certa" } }, faltando);
    assert.equal(faltando.codigo, 500);
    assert.ok(faltando.corpo.faltando.includes("VAPID_PRIVATE_KEY"));
  } finally {
    process.env = antes;
  }
});

// ---------- Banco (servidor) ----------

test("servidor lê inscrições em páginas e apaga pelo endereço", async () => {
  const chamadas = [];
  const paginas = [Array.from({ length: 1000 }, (_, i) => insc(String(i), "manha")), [insc("ultimo", "manha")]];
  const buscar = async (endereco, opcoes = {}) => {
    chamadas.push({ endereco, metodo: opcoes.method ?? "GET", apikey: opcoes.headers.apikey });
    return { ok: true, json: async () => paginas.shift() ?? [] };
  };
  const banco = criarBancoServidor({ url: "https://x.supabase.co", chave: "sb_secret_teste", buscar });

  const lista = await banco.buscarInscricoes(["manha", "tarde"]);
  assert.equal(lista.length, 1001);
  assert.equal(chamadas.length, 2);
  assert.match(chamadas[0].endereco, /inscricoes_lembrete\?select=endpoint,p256dh,auth,condominio_id&condominio_id=in\.\(manha,tarde\)/);
  assert.match(chamadas[1].endereco, /offset=1000/);
  assert.equal(chamadas[0].apikey, "sb_secret_teste");

  await banco.apagarInscricao("https://fcm.googleapis.com/fcm/send/a:b");
  assert.equal(chamadas[2].metodo, "DELETE");
  assert.match(chamadas[2].endereco, /endpoint=eq\.https%3A%2F%2Ffcm\.googleapis\.com%2Ffcm%2Fsend%2Fa%3Ab$/);
});

// ---------- App (celular) ----------

const base = {
  configurado: true,
  producao: true,
  iphone: false,
  instalado: false,
  temSW: true,
  temPush: true,
  temNotificacao: true,
  permissao: "default",
};

test("o que a tela mostra em cada aparelho", () => {
  assert.equal(avaliarAparelho({ ...base, configurado: false }), "em-breve");
  assert.equal(avaliarAparelho({ ...base, producao: false }), "desenvolvimento");
  assert.equal(avaliarAparelho(base), "pronto"); // Android no navegador
  assert.equal(avaliarAparelho({ ...base, iphone: true }), "iphone-instalar"); // iPhone fora da tela inicial
  assert.equal(avaliarAparelho({ ...base, iphone: true, instalado: true }), "pronto");
  assert.equal(avaliarAparelho({ ...base, iphone: true, instalado: true, temPush: false }), "sem-suporte"); // iOS antigo
  assert.equal(avaliarAparelho({ ...base, permissao: "denied" }), "bloqueado");
});

test("chave do lembrete e inscrição no formato do banco", () => {
  assert.deepEqual([...base64UrlParaBytes("AQID_-8")], [1, 2, 3, 255, 239]);
  assert.deepEqual(argumentosInscricao({ endpoint: "https://e", keys: { p256dh: "p", auth: "a" } }, "manha"), {
    p_endpoint: "https://e",
    p_p256dh: "p",
    p_auth: "a",
    p_condominio_id: "manha",
  });
});

test("app chama as funções do banco pelo caminho rpc/", async () => {
  let endereco = "";
  const banco = criarCliente({
    url: "https://x.supabase.co",
    chave: "sb_publishable_t",
    buscar: async (e) => {
      endereco = e;
      return { ok: true };
    },
  });
  assert.deepEqual(await banco.funcao("cancelar_inscricao", { p_endpoint: "https://e" }), { ok: true });
  assert.equal(endereco, "https://x.supabase.co/rest/v1/rpc/cancelar_inscricao");
});

test("api/lembrete: chave do lembrete errada vira erro claro e fica anotada (não derruba o servidor)", async () => {
  const antes = { ...process.env };
  const anotados = [];
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (endereco, opcoes = {}) => {
    if (String(endereco).includes("envios_lembrete")) anotados.push(JSON.parse(opcoes.body));
    return { ok: true, json: async () => [], text: async () => "" };
  };
  try {
    Object.assign(process.env, {
      LEMBRETE_SEGREDO: "senha-certa",
      VITE_SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_teste",
      VITE_VAPID_PUBLIC_KEY: "chave-publica-quebrada",
      VAPID_PRIVATE_KEY: "chave-privada-quebrada",
    });
    const res = respostaFalsa();
    await handler({ method: "POST", headers: { authorization: "Bearer senha-certa" } }, res);
    assert.equal(res.codigo, 500);
    assert.match(res.corpo.erro, /formato errado/);
    assert.equal(anotados.length, 1);
    assert.match(anotados[0].erro, /VAPID/);
  } finally {
    process.env = antes;
    globalThis.fetch = fetchOriginal;
  }
});
