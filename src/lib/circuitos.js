// Regras da coleta nas CASAS / RUAS (circuitos do SLU): dias, turno e próxima
// coleta, sempre no horário de Brasília. Os dados ficam em src/data/circuitosSlu.js.
// Testado em tests/circuitos.test.mjs.

import { AREAS, CIRCUITOS, TURNOS } from "../data/circuitosSlu.js";
import { FUSO, NOMES_DIAS, dataEmBrasilia } from "./coleta.js";

const DIAS_CURTOS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

// "08:00" -> 480 (minutos desde meia-noite)
const minutos = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
};

// "08:00" -> "8h"
const hora = (hhmm) => {
  const [h, m] = String(hhmm).split(":");
  return m && m !== "00" ? `${Number(h)}h${m}` : `${Number(h)}h`;
};

// Hora atual em Brasília, em minutos desde meia-noite.
export function minutosEmBrasilia(agora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);
  const pegar = (t) => Number(partes.find((p) => p.type === t).value);
  return pegar("hour") * 60 + pegar("minute");
}

// "manha" -> "de manhã (8h às 12h)"
export function descreverTurno(turno) {
  const t = TURNOS[turno];
  const artigo = turno === "manha" ? "de" : "à";
  return `${artigo} ${t.nome} (${hora(t.inicio)} às ${hora(t.fim)})`;
}

// ---------- Áreas ----------

// Todas as escolhas finais possíveis (área sem partes ou cada parte de uma área).
export function escolhasDaLista() {
  return AREAS.flatMap((a) =>
    a.partes
      ? a.partes.map((p) => ({ ...p, area: a.id, grupo: a.grupo, nomeCompleto: `${a.nome} — ${p.nome}` }))
      : [{ ...a, area: a.id, nomeCompleto: a.nome }],
  );
}

// Acha a escolha pelo id (área ou parte). Devolve null se não existir mais.
export function escolhaPorId(id) {
  return escolhasDaLista().find((e) => e.id === id) ?? null;
}

// Áreas agrupadas para a lista: [{ grupo, areas: [...] }]
export function areasPorGrupo() {
  const grupos = [];
  for (const a of AREAS) {
    let g = grupos.find((x) => x.grupo === a.grupo);
    if (!g) grupos.push((g = { grupo: a.grupo, areas: [] }));
    g.areas.push(a);
  }
  return grupos;
}

// ---------- Coletas ----------

// Coletas da escolha, em ordem: [{ dia, turno, circuito }]
export function coletasDe(escolha) {
  const lista = [];
  for (const codigo of escolha?.circuitos ?? []) {
    for (const c of CIRCUITOS[codigo] ?? []) lista.push({ ...c, circuito: codigo });
  }
  return lista.sort((a, b) => a.dia - b.dia || minutos(TURNOS[a.turno].inicio) - minutos(TURNOS[b.turno].inicio));
}

// "Segunda e quinta, de manhã (8h às 12h)" ou
// "Terça de manhã (8h às 12h) e sexta à tarde (13h às 18h)"
export function descreverColetas(escolha) {
  const coletas = coletasDe(escolha);
  if (!coletas.length) return "";
  const juntar = (itens) => (itens.length === 1 ? itens[0] : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`);
  const turnos = new Set(coletas.map((c) => c.turno));
  let texto;
  if (turnos.size === 1) {
    texto = `${juntar(coletas.map((c) => DIAS_CURTOS[c.dia]))}, ${descreverTurno(coletas[0].turno)}`;
  } else {
    texto = juntar(coletas.map((c) => `${DIAS_CURTOS[c.dia]} ${descreverTurno(c.turno)}`));
  }
  return texto[0].toUpperCase() + texto.slice(1);
}

// "Circuito 403201" ou "Circuitos 403202 / 403203"
export function textoCircuitos(escolha) {
  const codigos = escolha?.circuitos ?? [];
  return `${codigos.length > 1 ? "Circuitos" : "Circuito"} ${codigos.join(" / ")}`;
}

function somarDias({ ano, mes, dia }, n) {
  const d = new Date(Date.UTC(ano, mes - 1, dia + n));
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate(), diaSemana: d.getUTCDay() };
}

// Próximas coletas a partir de agora. Hoje só conta se o turno ainda não acabou.
// Cada item: { ano, mes, dia, diaSemana, diasAte, turno, circuito, agora: true se está no horário }
export function proximasColetasDe(escolha, agora = new Date(), quantidade = 4) {
  const coletas = coletasDe(escolha);
  if (!coletas.length) return [];
  const hoje = dataEmBrasilia(agora);
  const minAgora = minutosEmBrasilia(agora);
  const resultado = [];
  for (let n = 0; resultado.length < quantidade && n < 15; n++) {
    const data = somarDias(hoje, n);
    for (const c of coletas) {
      if (c.dia !== data.diaSemana || resultado.length >= quantidade) continue;
      const t = TURNOS[c.turno];
      if (n === 0 && minAgora >= minutos(t.fim)) continue; // turno de hoje já acabou
      const noHorario = n === 0 && minAgora >= minutos(t.inicio);
      resultado.push({ ...data, diasAte: n, turno: c.turno, circuito: c.circuito, agora: noHorario });
    }
  }
  return resultado;
}

export function proximaColetaDe(escolha, agora = new Date()) {
  return proximasColetasDe(escolha, agora, 1)[0] ?? null;
}

// "Agora, de manhã (8h às 12h)" / "Hoje, à tarde (13h às 18h)" /
// "Amanhã, terça, de manhã (8h às 12h)" / "Segunda-feira, 01/12, de manhã (8h às 12h)"
export function rotuloDaProxima(coleta) {
  if (!coleta) return "";
  const turno = descreverTurno(coleta.turno);
  if (coleta.diasAte === 0) return `${coleta.agora ? "Agora" : "Hoje"}, ${turno}`;
  if (coleta.diasAte === 1) return `Amanhã, ${DIAS_CURTOS[coleta.diaSemana]}, ${turno}`;
  const nome = NOMES_DIAS[coleta.diaSemana];
  const dd = String(coleta.dia).padStart(2, "0");
  const mm = String(coleta.mes).padStart(2, "0");
  return `${nome[0].toUpperCase()}${nome.slice(1)}, ${dd}/${mm}, ${turno}`;
}

// Confere se o arquivo dos circuitos está certo (usado pelos testes).
export function conferirCircuitos() {
  const erros = [];
  const ids = new Set();
  for (const [codigo, coletas] of Object.entries(CIRCUITOS)) {
    if (!/^\d{6}$/.test(codigo)) erros.push(`código de circuito estranho: ${codigo}`);
    if (!coletas.length) erros.push(`circuito ${codigo} sem dias`);
    for (const c of coletas) {
      if (!(c.dia >= 1 && c.dia <= 5)) erros.push(`circuito ${codigo}: dia ${c.dia} (só segunda a sexta)`);
      if (!TURNOS[c.turno]) erros.push(`circuito ${codigo}: turno "${c.turno}" não existe`);
    }
  }
  for (const e of escolhasDaLista()) {
    if (!/^[a-z0-9-]{1,60}$/.test(e.id)) erros.push(`id inválido: ${e.id}`);
    if (ids.has(e.id)) erros.push(`id repetido: ${e.id}`);
    ids.add(e.id);
    if (!e.circuitos?.length) erros.push(`${e.nomeCompleto} sem circuito`);
    for (const c of e.circuitos ?? []) if (!CIRCUITOS[c]) erros.push(`${e.nomeCompleto}: circuito ${c} não existe`);
  }
  for (const a of AREAS) if (ids.has(a.id) && a.partes) erros.push(`id repetido: ${a.id}`);
  return erros;
}
