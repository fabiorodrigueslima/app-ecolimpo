// Regras dos formulários "Fale com a cooperativa".
// Só o condomínio é obrigatório para identificar; nome e apartamento são opcionais.

import { TEMAS_PESQUISA, ESCALA, NAO_SEI, HABITOS } from "../data/pesquisa.js";

export { TEMAS_PESQUISA };

export const TIPOS_MENSAGEM = [
  { id: "elogio", rotulo: "Elogio" },
  { id: "sugestao", rotulo: "Sugestão" },
  { id: "reclamacao", rotulo: "Reclamação" },
  { id: "duvida", rotulo: "Dúvida" },
];

// Tipo que vem no endereço (ex.: /fale/mensagem?tipo=duvida). Só aceita tipos válidos.
export function tipoDoLink(busca) {
  const tipo = new URLSearchParams(busca ?? "").get("tipo");
  return TIPOS_MENSAGEM.some((t) => t.id === tipo) ? tipo : "";
}

export const LIMITES = { nome: 80, apartamento: 20, texto: 1000, detalhe: 300 };

// Nota baixa (1 ou 2): a pesquisa pergunta "O que aconteceu?".
export const NOTA_BAIXA = 2;

const limpar = (v) => {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
};

function conferirIdentificacao(dados, idsCondominios, erros) {
  if (!dados.condominioId || !idsCondominios.includes(dados.condominioId))
    erros.condominioId = "Escolha o seu condomínio.";
  if ((limpar(dados.nome) ?? "").length > LIMITES.nome) erros.nome = `O nome pode ter até ${LIMITES.nome} letras.`;
  if ((limpar(dados.apartamento) ?? "").length > LIMITES.apartamento)
    erros.apartamento = `O apartamento pode ter até ${LIMITES.apartamento} caracteres.`;
}

const notaValida = (n) => n === NAO_SEI.valor || ESCALA.some((e) => e.valor === n);
export const notaBaixa = (n) => Number.isInteger(n) && n <= NOTA_BAIXA;

// Estado inicial da pesquisa (usado pela tela).
export function pesquisaVazia(condominioId = "") {
  return {
    condominioId,
    notas: {},
    motivos: {},
    detalhes: {},
    nps: null,
    habito: "",
    melhorar: "",
    nome: "",
    apartamento: "",
  };
}

export function validarPesquisa(dados, idsCondominios) {
  const erros = {};
  conferirIdentificacao(dados, idsCondominios, erros);
  for (const tema of TEMAS_PESQUISA) {
    if (!notaValida(dados.notas?.[tema.id])) erros[`nota_${tema.id}`] = "Escolha uma opção.";
    if ((limpar(dados.detalhes?.[tema.id]) ?? "").length > LIMITES.detalhe)
      erros[`detalhe_${tema.id}`] = `O texto pode ter até ${LIMITES.detalhe} letras.`;
  }
  if (!Number.isInteger(dados.nps) || dados.nps < 0 || dados.nps > 10) erros.nps = "Escolha uma nota de 0 a 10.";
  if (!HABITOS.some((h) => h.id === dados.habito)) erros.habito = "Escolha uma opção.";
  if ((limpar(dados.melhorar) ?? "").length > LIMITES.texto) erros.melhorar = `O texto pode ter até ${LIMITES.texto} letras.`;
  return { ok: Object.keys(erros).length === 0, erros };
}

// Monta a resposta no formato que será guardado no banco.
export function montarPesquisa(dados) {
  const motivos = [];
  const detalhes = {};
  const nota = {};
  for (const tema of TEMAS_PESQUISA) {
    const n = dados.notas[tema.id];
    nota[tema.id] = Number.isInteger(n) ? n : null; // "Não sei" vira vazio
    if (!notaBaixa(n)) continue; // motivos só valem para nota baixa
    const validos = new Set(tema.motivos.map((m) => m.id));
    for (const m of dados.motivos?.[tema.id] ?? []) if (validos.has(m)) motivos.push(`${tema.id}:${m}`);
    const texto = limpar(dados.detalhes?.[tema.id]);
    if (texto) detalhes[tema.id] = texto;
  }
  return {
    tipo: "pesquisa",
    condominio_id: dados.condominioId,
    nome: limpar(dados.nome),
    apartamento: limpar(dados.apartamento),
    nota_coleta: nota.coleta,
    nota_mobilizacao: nota.mobilizacao,
    nota_atendimento: nota.atendimento,
    nps: dados.nps,
    habito: dados.habito,
    motivos: motivos.length ? motivos : null,
    detalhes: Object.keys(detalhes).length ? detalhes : null,
    texto: limpar(dados.melhorar),
  };
}

export function validarMensagem(dados, idsCondominios) {
  const erros = {};
  conferirIdentificacao(dados, idsCondominios, erros);
  if (!TIPOS_MENSAGEM.some((t) => t.id === dados.tipo)) erros.tipo = "Escolha o tipo da mensagem.";
  const texto = limpar(dados.texto) ?? "";
  if (texto.length < 3) erros.texto = "Escreva a sua mensagem.";
  else if (texto.length > LIMITES.texto) erros.texto = `A mensagem pode ter até ${LIMITES.texto} letras.`;
  return { ok: Object.keys(erros).length === 0, erros };
}

export function montarMensagem(dados) {
  return {
    tipo: dados.tipo,
    condominio_id: dados.condominioId,
    nome: limpar(dados.nome),
    apartamento: limpar(dados.apartamento),
    texto: limpar(dados.texto),
  };
}

// ---------- Uma resposta por celular por mês ----------

// "2026-11" no horário de Brasília.
export function mesDeReferencia(data = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(data);
  return `${p.find((x) => x.type === "year").value}-${p.find((x) => x.type === "month").value}`;
}

export function jaRespondeuNoMes(registro, data = new Date()) {
  return registro === mesDeReferencia(data);
}
