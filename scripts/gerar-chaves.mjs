// Gera as chaves do lembrete (VAPID) e a senha do despertador, e grava no
// arquivo .env.local (que NÃO vai para o Git). Não mostra as chaves na tela.
// Uso: npm.cmd run gerar-chaves
// Se as chaves já existirem no .env.local, não faz nada (para não quebrar
// os lembretes de quem já está inscrito).

import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import webpush from "web-push";

const ARQUIVO = ".env.local";
const atual = existsSync(ARQUIVO) ? readFileSync(ARQUIVO, "utf8") : "";

if (/^VAPID_PRIVATE_KEY=/m.test(atual)) {
  console.log("As chaves do lembrete já existem no .env.local. Nada foi alterado.");
} else {
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();
  const segredo = randomBytes(32).toString("base64url");
  const linhas = [
    "",
    "# Lembrete (Web Push) — gerado por npm run gerar-chaves",
    "# A chave pública vai para o app; a privada e o segredo NUNCA vão para o código.",
    `VITE_VAPID_PUBLIC_KEY=${publicKey}`,
    `VAPID_PRIVATE_KEY=${privateKey}`,
    `LEMBRETE_SEGREDO=${segredo}`,
    "",
  ];
  appendFileSync(ARQUIVO, (atual && !atual.endsWith("\n") ? "\n" : "") + linhas.join("\n"));
  console.log("Pronto: chaves do lembrete gravadas no .env.local.");
}
