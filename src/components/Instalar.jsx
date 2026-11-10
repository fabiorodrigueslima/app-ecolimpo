import { useEffect, useState } from "react";
import { IconeCompartilhar } from "./Icones.jsx";

// Convite para adicionar o app à tela inicial do celular.
// Android/Chrome: botão "Instalar". iPhone: explicação passo a passo.

function jaInstalado() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true
  );
}

function ehIphone() {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export default function Instalar() {
  const [pedido, setPedido] = useState(null);
  const [instalado, setInstalado] = useState(jaInstalado);
  const [iphone] = useState(ehIphone);

  useEffect(() => {
    const guardar = (e) => {
      e.preventDefault();
      setPedido(e);
    };
    const pronto = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", pronto);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", pronto);
    };
  }, []);

  if (instalado) return null;

  if (iphone) {
    return (
      <section className="cartao cartao-instalar" aria-labelledby="instalar-titulo">
        <h2 id="instalar-titulo">Coloque o app na tela inicial</h2>
        <ol className="passos">
          <li>
            Abra esta página no <strong>Safari</strong>.
          </li>
          <li>
            Toque em <strong>Compartilhar</strong> <IconeCompartilhar tamanho={18} className="inline" />.
          </li>
          <li>
            Escolha <strong>Adicionar à Tela de Início</strong>.
          </li>
        </ol>
        <p className="dica">
          No iPhone, o lembrete da coleta só funciona com o app na tela inicial (iOS 16.4 ou mais novo).
        </p>
      </section>
    );
  }

  if (!pedido) return null;

  return (
    <section className="cartao cartao-instalar" aria-labelledby="instalar-titulo">
      <h2 id="instalar-titulo">Coloque o app na tela inicial</h2>
      <p>Abra o app da Ecolimpo com um toque, como qualquer outro aplicativo.</p>
      <button
        type="button"
        className="botao botao-primario"
        onClick={async () => {
          pedido.prompt();
          await pedido.userChoice.catch(() => null);
          setPedido(null);
        }}
      >
        Instalar o app
      </button>
    </section>
  );
}
