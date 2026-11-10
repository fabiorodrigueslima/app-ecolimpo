// Acesso do SERVIDOR ao Supabase, com a chave SECRETA (só no servidor,
// nunca no app). Lê e apaga inscrições do lembrete.

import { cabecalhos } from "../src/lib/supabase.js";

const POR_PAGINA = 1000;

export function criarBancoServidor({ url, chave, buscar = globalThis.fetch }) {
  const base = `${url.replace(/\/+$/, "")}/rest/v1/inscricoes_lembrete`;

  async function buscarInscricoes(idsCondominios) {
    const lista = [];
    const filtro = `condominio_id=in.(${idsCondominios.map(encodeURIComponent).join(",")})`;
    for (let pagina = 0; ; pagina++) {
      const endereco = `${base}?select=endpoint,p256dh,auth,condominio_id&${filtro}&order=endpoint&limit=${POR_PAGINA}&offset=${pagina * POR_PAGINA}`;
      const resposta = await buscar(endereco, { headers: cabecalhos(chave) });
      if (!resposta.ok) throw new Error(`Supabase respondeu ${resposta.status} ao ler inscrições`);
      const parte = await resposta.json();
      lista.push(...parte);
      if (parte.length < POR_PAGINA) return lista;
    }
  }

  async function apagarInscricao(endpoint) {
    const resposta = await buscar(`${base}?endpoint=eq.${encodeURIComponent(endpoint)}`, {
      method: "DELETE",
      headers: cabecalhos(chave),
    });
    if (!resposta.ok) throw new Error(`Supabase respondeu ${resposta.status} ao apagar inscrição`);
  }

  return { buscarInscricoes, apagarInscricao };
}
