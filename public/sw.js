// Service worker do app Ecolimpo.
// Guarda uma cópia do app no celular para abrir rápido e mesmo sem internet.
// Ao mudar este arquivo, aumente a VERSAO para os celulares baixarem a nova cópia.

const VERSAO = "ecolimpo-v1";
const ESSENCIAIS = ["/", "/manifest.webmanifest", "/Nova-logo.png", "/icon-192.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ESSENCIAIS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);
  if (pedido.method !== "GET" || url.origin !== self.location.origin) return;

  // Páginas: tenta a internet primeiro (para ter a versão mais nova); sem internet, usa a cópia.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put("/", copia));
          return resposta;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Arquivos (JS, CSS, imagens): usa a cópia e atualiza em segundo plano.
  evento.respondWith(
    caches.match(pedido).then((guardado) => {
      const daInternet = fetch(pedido)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put(pedido, copia));
          }
          return resposta;
        })
        .catch(() => guardado);
      return guardado || daInternet;
    }),
  );
});
