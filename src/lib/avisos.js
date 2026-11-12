// Avisos da cooperativa para um condomínio (ex.: ação de mobilização).
// Publicados pelo painel (aba Avisos), mostrados na tela Início do morador
// até o fim do dia da ação e enviados às 6h30 desse dia para quem ligou o lembrete.
// Testado em tests/avisos.test.mjs. Banco: supabase/016_avisos.sql.

import { NOMES_DIAS, dataEmBrasilia, formatarHorario } from "./coleta.js";

export const TEXTO_MINIMO = 10;
export const TEXTO_MAXIMO = 400;

// "2026-11-14" -> { ano, mes, dia, diaSemana }
function lerData(iso) {
  const [ano, mes, dia] = String(iso).split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return { ano, mes, dia, diaSemana: d.getUTCDay() };
}

const doisDigitos = (n) => String(n).padStart(2, "0");

// Hoje em Brasília no formato do banco: "2026-11-12".
export function hojeISO(agora = new Date()) {
  const { ano, mes, dia } = dataEmBrasilia(agora);
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;
}

// "2026-11-14" -> "14/11"
export function dataCurta(iso) {
  const { dia, mes } = lerData(iso);
  return `${doisDigitos(dia)}/${doisDigitos(mes)}`;
}

// "Hoje", "Amanhã" ou "Sexta-feira, 14/11"
export function rotuloDataAviso(iso, agora = new Date()) {
  const hoje = lerData(hojeISO(agora));
  const alvo = lerData(iso);
  const dias = Math.round((Date.UTC(alvo.ano, alvo.mes - 1, alvo.dia) - Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia)) / 86400000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  const nome = NOMES_DIAS[alvo.diaSemana];
  return `${nome[0].toUpperCase()}${nome.slice(1)}, ${dataCurta(iso)}`;
}

// Texto pronto, a partir do modelo da cooperativa (a equipe pode editar antes de publicar).
export function textoModeloAviso({ nome, data, inicio, fim }) {
  const quando = inicio && fim ? `, das ${formatarHorario(inicio)} às ${formatarHorario(fim)}` : "";
  return (
    `Atenção, moradores do ${String(nome).trim()}! No dia ${dataCurta(data)}${quando}, ` +
    "nossos mobilizadores estarão transitando pelo condomínio para tirar dúvidas sobre a Coleta Seletiva Inclusiva. " +
    "Contamos com o seu apoio!"
  );
}

// Confere o aviso antes de publicar. A data não pode ser no passado.
export function validarAviso(dados, agora = new Date()) {
  const erros = {};
  if (!dados.condominio_id) erros.condominio_id = "Escolha o condomínio.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dados.data ?? ""))) erros.data = "Escolha a data da ação.";
  else if (dados.data < hojeISO(agora)) erros.data = "A data já passou.";
  const texto = String(dados.texto ?? "").trim();
  if (texto.length < TEXTO_MINIMO) erros.texto = "Escreva o aviso.";
  else if (texto.length > TEXTO_MAXIMO) erros.texto = `O aviso pode ter até ${TEXTO_MAXIMO} letras.`;
  return { ok: Object.keys(erros).length === 0, erros };
}

// Dados da tela -> linha do banco.
export function linhaDoAviso(dados) {
  return {
    condominio_id: dados.condominio_id,
    data: dados.data,
    texto: String(dados.texto).trim(),
    notificar: Boolean(dados.notificar),
  };
}

// Notificação no celular (6h30 do dia da ação). A "tag" diferente evita
// que o aviso apague o lembrete da coleta do mesmo dia.
export function mensagemDoAviso(aviso) {
  return {
    titulo: "Aviso da Cooperativa Ecolimpo",
    corpo: aviso.texto,
    url: "/",
    tag: `aviso-${aviso.id}`,
  };
}
