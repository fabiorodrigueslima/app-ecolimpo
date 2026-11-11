// Conversa com o Supabase pela API REST (sem biblioteca extra).
// No app, a chave usada é a PÚBLICA (publishable/anon): ela pode ficar no
// app porque o banco só deixa enviar respostas e chamar as funções do
// lembrete (regras nos arquivos supabase/*.sql).
// A chave "secret"/"service_role" só é usada no servidor (pasta api/).

export function cabecalhos(chave) {
  const h = { apikey: chave, "Content-Type": "application/json" };
  // Chaves antigas (formato JWT) também vão no Authorization.
  if (!/^sb_(publishable|secret)_/.test(chave)) h.Authorization = `Bearer ${chave}`;
  return h;
}

export function montarPedido(url, chave, caminho, dados) {
  return {
    endereco: `${url.replace(/\/+$/, "")}/rest/v1/${caminho}`,
    opcoes: {
      method: "POST",
      // "return=minimal": o banco não devolve a linha (o app não tem permissão de leitura).
      headers: { ...cabecalhos(chave), Prefer: "return=minimal" },
      body: JSON.stringify(dados),
    },
  };
}

// Cria o "cliente": inserir(tabela, dados) e funcao(nome, argumentos).
// "buscar" é o fetch (trocado nos testes).
export function criarCliente({ url, chave, buscar = globalThis.fetch, limiteMs = 15000 }) {
  async function postar(caminho, dados) {
    const { endereco, opcoes } = montarPedido(url, chave, caminho, dados);
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), limiteMs);
    try {
      const resposta = await buscar(endereco, { ...opcoes, signal: controle.signal });
      if (resposta.ok) return { ok: true };
      // O banco avisa "limite_de_envios" quando chegam envios demais (proteção contra spam).
      const texto = typeof resposta.text === "function" ? await resposta.text().catch(() => "") : "";
      return { ok: false, status: resposta.status, limite: texto.includes("limite_de_envios") };
    } catch {
      return { ok: false, status: 0 }; // sem internet ou demorou demais
    } finally {
      clearTimeout(relogio);
    }
  }

  return {
    inserir: (tabela, dados) => postar(tabela, dados),
    funcao: (nome, argumentos) => postar(`rpc/${nome}`, argumentos),
    ler: (caminho) => requisitar({ url, chave, buscar, limiteMs }, "GET", `rest/v1/${caminho}`),
    // Chama uma função do banco e devolve a resposta dela ({ ok, status, dados }).
    consultar: (nome, argumentos) =>
      requisitar({ url, chave, buscar, limiteMs }, "POST", `rest/v1/rpc/${nome}`, { corpo: argumentos }),
  };
}

// Pedido genérico (usado para ler dados e pelo painel com login).
// caminho: "rest/v1/..." ou "auth/v1/...". token: login da equipe (opcional).
// Devolve { ok, status, dados }.
export async function requisitar(
  { url, chave, token, buscar = globalThis.fetch, limiteMs = 15000 },
  metodo,
  caminho,
  { corpo, prefer } = {},
) {
  const headers = cabecalhos(chave);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), limiteMs);
  try {
    const resposta = await buscar(`${url.replace(/\/+$/, "")}/${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    });
    const texto = typeof resposta.text === "function" ? await resposta.text() : "";
    let dados = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = texto;
    }
    return { ok: resposta.ok, status: resposta.status, dados };
  } catch {
    return { ok: false, status: 0, dados: null };
  } finally {
    clearTimeout(relogio);
  }
}

// Mantido para quem só precisa inserir.
export function criarInsercao(opcoes) {
  return criarCliente(opcoes).inserir;
}
