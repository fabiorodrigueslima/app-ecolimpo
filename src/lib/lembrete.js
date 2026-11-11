// Lembrete no celular (Web Push): ligar, desligar e trocar o condomínio.
// A notificação em si é mostrada pelo service worker (public/sw.js) e
// enviada todo dia pelo servidor (api/lembrete.js).

import { banco, LEMBRETE_CONFIGURADO, PRODUCAO, VAPID_PUBLICA } from "./config.js";

// ---------- Regras puras (testadas em tests/lembrete.test.mjs) ----------

// Decide o que mostrar na tela, conforme o aparelho.
export function avaliarAparelho({ configurado, producao, iphone, instalado, temSW, temPush, temNotificacao, permissao }) {
  if (!configurado) return "em-breve";
  if (!producao) return "desenvolvimento";
  if (iphone && !instalado) return "iphone-instalar";
  if (!temSW || !temPush || !temNotificacao) return "sem-suporte";
  if (permissao === "denied") return "bloqueado";
  return "pronto";
}

// Chave VAPID (texto base64url) -> bytes, como o navegador pede.
export function base64UrlParaBytes(texto) {
  const base64 = (texto + "=".repeat((4 - (texto.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Inscrição do navegador -> argumentos da função salvar_inscricao do banco.
export function argumentosInscricao(inscricao, condominioId) {
  return {
    p_endpoint: inscricao.endpoint,
    p_p256dh: inscricao.keys.p256dh,
    p_auth: inscricao.keys.auth,
    p_condominio_id: condominioId,
  };
}

// ---------- Uso no navegador ----------

export function ehIphone() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function estaInstalado() {
  return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
}

export function situacaoDoAparelho() {
  return avaliarAparelho({
    configurado: LEMBRETE_CONFIGURADO,
    producao: PRODUCAO,
    iphone: ehIphone(),
    instalado: estaInstalado(),
    temSW: "serviceWorker" in navigator,
    temPush: "PushManager" in window,
    temNotificacao: "Notification" in window,
    permissao: "Notification" in window ? Notification.permission : "default",
  });
}

async function registro() {
  const espera = new Promise((_, falhar) => setTimeout(() => falhar(new Error("sem service worker")), 8000));
  return Promise.race([navigator.serviceWorker.ready, espera]);
}

export async function lembreteLigado() {
  try {
    return Boolean(await (await registro()).pushManager.getSubscription());
  } catch {
    return false;
  }
}

export async function ligarLembrete(condominioId) {
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return { ok: false, motivo: permissao === "denied" ? "bloqueado" : "recusado" };

  let inscricao;
  try {
    const reg = await registro();
    inscricao =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlParaBytes(VAPID_PUBLICA),
      }));
  } catch {
    return { ok: false, motivo: "erro" };
  }

  const r = await banco.funcao("salvar_inscricao", argumentosInscricao(inscricao.toJSON(), condominioId));
  if (!r.ok) {
    await inscricao.unsubscribe().catch(() => {});
    return { ok: false, motivo: r.limite ? "limite" : "rede" };
  }
  return { ok: true };
}

export async function desligarLembrete() {
  try {
    const inscricao = await (await registro()).pushManager.getSubscription();
    if (!inscricao) return { ok: true };
    await banco.funcao("cancelar_inscricao", { p_endpoint: inscricao.endpoint });
    // Mesmo se o banco não responder, o celular deixa de aceitar; o servidor
    // apaga a inscrição sozinho no próximo envio.
    await inscricao.unsubscribe();
    return { ok: true };
  } catch {
    return { ok: false, motivo: "erro" };
  }
}

// Quando o morador troca de condomínio, o lembrete passa a seguir o novo.
export async function atualizarCondominioDoLembrete(condominioId) {
  if (!LEMBRETE_CONFIGURADO || !("serviceWorker" in navigator)) return;
  try {
    const inscricao = await (await registro()).pushManager.getSubscription();
    if (inscricao) await banco.funcao("salvar_inscricao", argumentosInscricao(inscricao.toJSON(), condominioId));
  } catch {
    // Sem internet agora: tudo bem, na próxima vez que ligar o lembrete atualiza.
  }
}
