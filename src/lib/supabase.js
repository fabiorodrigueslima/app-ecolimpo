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
      return resposta.ok ? { ok: true } : { ok: false, status: resposta.status };
    } catch {
      return { ok: false, status: 0 }; // sem internet ou demorou demais
    } finally {
      clearTimeout(relogio);
    }
  }

  return {
    inserir: (tabela, dados) => postar(tabela, dados),
    funcao: (nome, argumentos) => postar(`rpc/${nome}`, argumentos),
  };
}

// Mantido para quem só precisa inserir.
export function criarInsercao(opcoes) {
  return criarCliente(opcoes).inserir;
}
