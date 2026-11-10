// De onde vem a lista de condomínios do app:
//   * Com banco (Supabase configurado): da tabela "condominios", editada pelo
//     painel. Fica uma cópia no celular para abrir sem internet.
//   * Sem banco (modo de teste): do arquivo src/data/condominios.js.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { condominios as doArquivo } from "../data/condominios.js";
import { banco, BANCO_LIGADO } from "./config.js";

const CHAVE_COPIA = "ecolimpo:condominios";
export const CAMINHO_CONDOMINIOS = "condominios?select=id,nome,regiao,dias,horario,piloto&ativo=is.true&order=nome";

export const CondominiosContexto = createContext([]);

export function useCondominios() {
  return useContext(CondominiosContexto);
}

// Linha do banco -> formato usado no app.
export function normalizarCondominio(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    regiao: linha.regiao ?? "",
    dias: (linha.dias ?? []).map(Number).sort((a, b) => a - b),
    horario: linha.horario,
    piloto: Boolean(linha.piloto),
  };
}

function lerCopia() {
  try {
    const texto = localStorage.getItem(CHAVE_COPIA);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarCopia(lista) {
  try {
    localStorage.setItem(CHAVE_COPIA, JSON.stringify(lista));
  } catch {
    // sem armazenamento: segue sem cópia
  }
}

// Busca no banco; devolve a lista ou null (sem internet / erro).
async function buscarLista() {
  const r = await banco.ler(CAMINHO_CONDOMINIOS);
  return r.ok && Array.isArray(r.dados) ? r.dados.map(normalizarCondominio) : null;
}

export function useCarregarCondominios() {
  const [estado, setEstado] = useState(() => {
    if (!BANCO_LIGADO) return { lista: doArquivo, carregando: false, erro: false };
    const copia = lerCopia();
    return { lista: copia ?? [], carregando: !copia, erro: false };
  });

  const aplicar = useCallback((lista) => {
    if (lista) {
      salvarCopia(lista);
      setEstado({ lista, carregando: false, erro: false });
    } else {
      setEstado((e) => ({ ...e, carregando: false, erro: e.lista.length === 0 }));
    }
  }, []);

  useEffect(() => {
    // Busca a lista atualizada ao abrir o app (a cópia aparece enquanto isso).
    if (!BANCO_LIGADO) return;
    let ativo = true;
    buscarLista().then((lista) => ativo && aplicar(lista));
    return () => {
      ativo = false;
    };
  }, [aplicar]);

  const tentarDeNovo = useCallback(() => {
    setEstado((e) => ({ ...e, carregando: true, erro: false }));
    buscarLista().then(aplicar);
  }, [aplicar]);

  return { ...estado, tentarDeNovo };
}
