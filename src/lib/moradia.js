// Onde o morador mora: em CONDOMÍNIO (como sempre foi) ou em CASA / RUA
// (circuitos do SLU, só informativo). A escolha fica só no celular:
//   localStorage "ecolimpo:moradia" = { tipo: "casa", area: "<id>" }
//                                   | { tipo: "casa", foraDaLista: true }
//                                   | { tipo: "condominio" }
// Quem já usava o app com um condomínio salvo (sem essa chave) continua em
// "condomínio", sem precisar escolher de novo.

import { useState } from "react";
import { escolhaPorId } from "./circuitos.js";

const CHAVE = "ecolimpo:moradia";
export const FORA_DA_LISTA = "fora-da-lista";

export function lerMoradia(armazem = globalThis.localStorage) {
  try {
    const m = JSON.parse(armazem?.getItem(CHAVE) ?? "null");
    return m && (m.tipo === "casa" || m.tipo === "condominio") ? m : null;
  } catch {
    return null;
  }
}

export function salvarMoradia(moradia, armazem = globalThis.localStorage) {
  try {
    if (moradia) armazem?.setItem(CHAVE, JSON.stringify(moradia));
    else armazem?.removeItem(CHAVE);
  } catch {
    // sem armazenamento: vale só enquanto o app estiver aberto
  }
}

// Casa do morador, pronta para as telas:
//   { tipo: "casa", escolha: {...área/parte do arquivo...} }  ou
//   { tipo: "casa", foraDaLista: true }  ou  null (não é casa / área sumiu da lista)
export function casaDaMoradia(moradia) {
  if (moradia?.tipo !== "casa") return null;
  if (moradia.foraDaLista) return { tipo: "casa", foraDaLista: true };
  const escolha = escolhaPorId(moradia.area);
  return escolha ? { tipo: "casa", escolha } : null; // se o SLU tirar a área, pede para escolher de novo
}

// Lugar da casa para os contadores ("bairro:<id>").
export function localDaCasa(casa) {
  if (!casa) return null;
  return { tipo: "bairro", id: casa.foraDaLista ? FORA_DA_LISTA : casa.escolha.id };
}

// Nome curto para mostrar na tela: "Bairro São José" / "Residencial Oeste — Quadras 101 até 104".
export function nomeDaCasa(casa) {
  if (!casa) return "";
  return casa.foraDaLista ? "Área fora da lista" : casa.escolha.nomeCompleto;
}

export function useMoradia() {
  const [moradia, setMoradia] = useState(() => lerMoradia());

  function escolherCasa(areaId) {
    const nova = areaId === FORA_DA_LISTA ? { tipo: "casa", foraDaLista: true } : { tipo: "casa", area: areaId };
    salvarMoradia(nova);
    setMoradia(nova);
  }

  function escolherCondominio() {
    const nova = { tipo: "condominio" };
    salvarMoradia(nova);
    setMoradia(nova);
  }

  return { moradia, casa: casaDaMoradia(moradia), escolherCasa, escolherCondominio };
}
