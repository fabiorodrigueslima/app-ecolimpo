// Condomínio do morador.
// A lista de condomínios é PRIVADA (sigilo comercial e segurança):
//   * O app nunca baixa a lista inteira.
//   * O morador chega pelo QR Code do cartaz (o condomínio já vem marcado) ou
//     digita pelo menos 4 letras do nome; o banco devolve no máximo 3.
//   * O celular guarda só o condomínio escolhido (para abrir sem internet).
// Sem banco (modo de teste), a busca usa o arquivo src/data/condominios.js
// com as mesmas regras.

import { createContext, useContext, useEffect, useState } from "react";
import { condominios as doArquivo } from "../data/condominios.js";
import { banco, BANCO_LIGADO } from "./config.js";
import { normalizar } from "./busca.js";
import { lerCondominioSalvo, salvarCondominio } from "./armazenamento.js";

export const MINIMO_LETRAS = 4;
export const MAXIMO_RESULTADOS = 3;

const CHAVE_DADOS = "ecolimpo:condominio-dados";
const CHAVE_LISTA_ANTIGA = "ecolimpo:condominios"; // versões antigas guardavam a lista inteira

export const CondominioContexto = createContext(null);

export function useCondominioAtual() {
  return useContext(CondominioContexto);
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
    ...(linha.exemplo ? { exemplo: true } : {}),
  };
}

// ---------- Regras da busca (testadas em tests/condominios.test.mjs) ----------

export function termoValido(texto) {
  return normalizar(texto).length >= MINIMO_LETRAS;
}

// Mesmas regras do banco (SQL 010): pelo menos 4 letras, no máximo 3 resultados.
export function filtrarCondominios(lista, texto) {
  if (!termoValido(texto)) return [];
  const termo = normalizar(texto);
  return lista
    .filter((c) => normalizar(c.nome).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .slice(0, MAXIMO_RESULTADOS);
}

// ---------- Perguntas ao banco ----------

export async function buscarCondominios(texto) {
  if (!termoValido(texto)) return { ok: true, lista: [] };
  if (!BANCO_LIGADO) return { ok: true, lista: filtrarCondominios(doArquivo, texto).map(normalizarCondominio) };
  const r = await banco.consultar("buscar_condominios", { p_texto: texto });
  return r.ok && Array.isArray(r.dados) ? { ok: true, lista: r.dados.map(normalizarCondominio) } : { ok: false, lista: [] };
}

export async function condominioPorId(id) {
  if (!id) return { ok: true, condominio: null };
  if (!BANCO_LIGADO) {
    const achado = doArquivo.find((c) => c.id === id);
    return { ok: true, condominio: achado ? normalizarCondominio(achado) : null };
  }
  const r = await banco.consultar("condominio_por_id", { p_id: id });
  if (!r.ok || !Array.isArray(r.dados)) return { ok: false, condominio: null };
  return { ok: true, condominio: r.dados[0] ? normalizarCondominio(r.dados[0]) : null };
}

// ---------- O que fica guardado no celular ----------

function lerGuardado() {
  try {
    localStorage.removeItem(CHAVE_LISTA_ANTIGA);
    const texto = localStorage.getItem(CHAVE_DADOS);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function guardar(condominio) {
  salvarCondominio(condominio?.id ?? null);
  try {
    if (condominio) localStorage.setItem(CHAVE_DADOS, JSON.stringify(condominio));
    else localStorage.removeItem(CHAVE_DADOS);
  } catch {
    // sem armazenamento: vale só enquanto o app estiver aberto
  }
}

// Condomínio do morador: usa o guardado na hora e confere no banco se mudou
// (dia/horário) ou se saiu do app (aí pede para escolher de novo).
export function useCondominioMorador() {
  const [idInicial] = useState(() => lerGuardado()?.id ?? lerCondominioSalvo());
  const [estado, setEstado] = useState(() => {
    const guardado = lerGuardado();
    return { condominio: guardado, carregando: !guardado && Boolean(idInicial) };
  });

  useEffect(() => {
    if (!idInicial) return;
    let ativo = true;
    condominioPorId(idInicial).then((r) => {
      if (!ativo) return;
      if (!r.ok) return setEstado((e) => ({ ...e, carregando: false })); // sem internet: segue com o guardado
      guardar(r.condominio);
      setEstado({ condominio: r.condominio, carregando: false });
    });
    return () => {
      ativo = false;
    };
  }, [idInicial]);

  function escolher(condominio) {
    guardar(condominio);
    setEstado({ condominio, carregando: false });
  }

  return { ...estado, escolher };
}
