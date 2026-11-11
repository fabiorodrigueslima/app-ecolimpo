import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY, VERIFICACAO_LIGADA } from "../lib/config.js";
import { carregarTurnstile } from "../lib/turnstile.js";

// Verificação anti-robô (Cloudflare Turnstile). Quase sempre invisível: só
// aparece uma caixinha para tocar quando a Cloudflare desconfia.
// Para recomeçar depois de um envio, o formulário troca a "key" do componente.
export default function VerificacaoHumana({ aoVerificar }) {
  const caixa = useRef(null);
  const retorno = useRef(aoVerificar);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    retorno.current = aoVerificar;
  }, [aoVerificar]);

  useEffect(() => {
    if (!VERIFICACAO_LIGADA) return;
    let ativo = true;
    let id = null;
    carregarTurnstile()
      .then((turnstile) => {
        if (!ativo || !caixa.current) return;
        id = turnstile.render(caixa.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: "pt-br",
          appearance: "interaction-only",
          callback: (token) => {
            setFalhou(false);
            retorno.current(token);
          },
          "expired-callback": () => retorno.current(null),
          "error-callback": () => {
            retorno.current(null);
            setFalhou(true);
          },
        });
      })
      .catch(() => ativo && setFalhou(true));
    return () => {
      ativo = false;
      if (id !== null) window.turnstile?.remove(id);
    };
  }, []);

  if (!VERIFICACAO_LIGADA) return null;
  return (
    <div className="verificacao-humana">
      <div ref={caixa} />
      {falhou && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível fazer a verificação de segurança. Confira a internet e recarregue a página.
        </p>
      )}
    </div>
  );
}
