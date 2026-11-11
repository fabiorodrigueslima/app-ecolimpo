// Carrega o anti-robô da Cloudflare (Turnstile) uma vez só, quando precisar.

const ENDERECO = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let carregando = null;

export function carregarTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  carregando ??= new Promise((pronto, falhou) => {
    const script = document.createElement("script");
    script.src = ENDERECO;
    script.async = true;
    script.onload = () => (window.turnstile ? pronto(window.turnstile) : falhou(new Error("sem turnstile")));
    script.onerror = () => {
      carregando = null;
      falhou(new Error("não carregou"));
    };
    document.head.appendChild(script);
  });
  return carregando;
}
