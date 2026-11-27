// Contadores de uso do app: só números por dia, sem dados pessoais.
// O app manda "+1" para o banco (função "contar", supabase/017_contagens_uso.sql)
// com o TIPO e o LUGAR (condomínio ou bairro). Nunca manda nome, telefone,
// código do aparelho ou localização. Se der erro ou estiver sem internet,
// o app segue normal (a contagem só se perde).
//
// O celular guarda apenas marcas para NÃO contar duas vezes:
//   * sessionStorage "ecolimpo:contou-abertura": já contou esta visita;
//   * localStorage  "ecolimpo:contou-instalacao": já contou a instalação;
//   * localStorage  "ecolimpo:nao-contar": celular da equipe (entrou no painel),
//     não entra nos números.
// Essas marcas ficam só no celular; nada disso vai para o banco.

import { banco, BANCO_LIGADO } from "./config.js";

export const TIPOS = ["abertura", "instalacao", "qr", "whatsapp", "ouvidoria", "mapa_slu", "fora_da_lista", "escolha_bairro"];

const MARCA_ABERTURA = "ecolimpo:contou-abertura";
const MARCA_INSTALACAO = "ecolimpo:contou-instalacao";
const MARCA_EQUIPE = "ecolimpo:nao-contar";

function ler(armazem, chave) {
  try {
    return globalThis[armazem]?.getItem(chave) ?? null;
  } catch {
    return null;
  }
}

function marcar(armazem, chave) {
  try {
    globalThis[armazem]?.setItem(chave, "1");
  } catch {
    // sem armazenamento: pode contar de novo, sem problema
  }
}

// Lugar no formato do banco: id do condomínio, "bairro:<id>" ou "" (nenhum).
export function lugarDe(local) {
  if (!local) return "";
  if (typeof local === "string") return local;
  if (local.tipo === "bairro" && local.id) return `bairro:${local.id}`;
  return local.id ?? "";
}

// Celular da equipe: quem entra no painel neste aparelho não é contado.
export function marcarAparelhoDaEquipe() {
  marcar("localStorage", MARCA_EQUIPE);
}

export function aparelhoDaEquipe() {
  return ler("localStorage", MARCA_EQUIPE) === "1";
}

// Soma +1. Não espera resposta e nunca dá erro para o morador.
export function contar(tipo, local = "", { enviar } = {}) {
  if (!TIPOS.includes(tipo) || aparelhoDaEquipe()) return false;
  const mandar = enviar ?? (BANCO_LIGADO ? (args) => banco.funcao("contar", args) : null);
  if (!mandar) return false;
  Promise.resolve()
    .then(() => mandar({ p_tipo: tipo, p_local: lugarDe(local) }))
    .catch(() => {});
  return true;
}

// O app está aberto como app instalado (ícone na tela inicial)?
export function abertoComoApp() {
  try {
    return Boolean(globalThis.matchMedia?.("(display-mode: standalone)").matches || globalThis.navigator?.standalone);
  } catch {
    return false;
  }
}

// Chamada uma vez quando o app abre (depois de saber o local do morador).
// Conta: a abertura (1 por visita), a instalação (1 vez por aparelho) e a
// entrada pelo QR Code (?c= no endereço).
export function contarAbertura({ local, veioDoQr = "" } = {}, opcoes) {
  const contados = [];
  if (ler("sessionStorage", MARCA_ABERTURA) !== "1") {
    marcar("sessionStorage", MARCA_ABERTURA);
    if (contar("abertura", local, opcoes)) contados.push("abertura");
    if (veioDoQr && contar("qr", veioDoQr, opcoes)) contados.push("qr");
  }
  if (abertoComoApp() && ler("localStorage", MARCA_INSTALACAO) !== "1") {
    marcar("localStorage", MARCA_INSTALACAO);
    if (contar("instalacao", local, opcoes)) contados.push("instalacao");
  }
  return contados;
}

// Android/computador avisam quando o app é instalado (o iPhone não avisa:
// lá a instalação é contada na primeira vez que o app abre pelo ícone).
export function ouvirInstalacao(obterLocal) {
  const aoInstalar = () => {
    if (ler("localStorage", MARCA_INSTALACAO) === "1") return;
    marcar("localStorage", MARCA_INSTALACAO);
    contar("instalacao", obterLocal());
  };
  globalThis.addEventListener?.("appinstalled", aoInstalar);
  return () => globalThis.removeEventListener?.("appinstalled", aoInstalar);
}
