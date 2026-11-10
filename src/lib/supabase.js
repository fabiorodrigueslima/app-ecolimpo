// Conversa com o Supabase pela API REST (sem biblioteca extra).
// A chave usada aqui é a chave PÚBLICA (publishable/anon): ela pode ficar no
// app porque o banco só deixa ENVIAR respostas (regras RLS no arquivo
// supabase/001_respostas.sql). Nunca use aqui a chave "secret"/"service_role".

export function cabecalhos(chave) {
  const h = { apikey: chave, "Content-Type": "application/json" };
  // Chaves antigas (anon, formato JWT) também vão no Authorization.
  if (!chave.startsWith("sb_publishable_")) h.Authorization = `Bearer ${chave}`;
  return h;
}

export function montarPedido(url, chave, tabela, dados) {
  return {
    endereco: `${url.replace(/\/+$/, "")}/rest/v1/${tabela}`,
    opcoes: {
      method: "POST",
      // "return=minimal": o banco não devolve a linha (o app não tem permissão de leitura).
      headers: { ...cabecalhos(chave), Prefer: "return=minimal" },
      body: JSON.stringify(dados),
    },
  };
}

// Cria a função que grava uma linha. "buscar" é o fetch (trocado nos testes).
export function criarInsercao({ url, chave, buscar = globalThis.fetch, limiteMs = 15000 }) {
  return async function inserir(tabela, dados) {
    const { endereco, opcoes } = montarPedido(url, chave, tabela, dados);
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
  };
}
