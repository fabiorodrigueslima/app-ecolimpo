import { Link } from "react-router-dom";
import { ENVIO_LIGADO } from "../lib/envio.js";
import { IconeCheck, IconePredio } from "./Icones.jsx";

// Condomínio do morador nos formulários: fixo (a lista de condomínios é privada).
export function CampoCondominio({ condominio }) {
  return (
    <div className="condominio-atual">
      <IconePredio tamanho={22} />
      <div>
        <small>Seu condomínio</small>
        <strong>{condominio.nome}</strong>
      </div>
      <Link to="/condominio" className="link-pequeno">
        Trocar
      </Link>
    </div>
  );
}


export function Obrigado({ titulo, texto = "A cooperativa Ecolimpo agradece a sua participação." }) {
  return (
    <div className="pagina obrigado">
      <span className="obrigado-icone">
        <IconeCheck tamanho={40} />
      </span>
      <h1>{titulo}</h1>
      <p>{texto}</p>
      {!ENVIO_LIGADO && (
        <p className="aviso-preencher" role="note">
          <strong>Versão de teste:</strong> a resposta ainda não é enviada à cooperativa. O envio será ligado na próxima
          etapa.
        </p>
      )}
      <Link to="/" className="botao botao-primario botao-largo">
        Voltar ao início
      </Link>
    </div>
  );
}

export function BotaoEnviar({ estado }) {
  return (
    <>
      {estado === "falhou" && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível enviar agora. Confira a internet e tente de novo.
        </p>
      )}
      {estado === "limite" && (
        <p className="erro erro-bloco" role="alert">
          Recebemos muitos envios neste momento. Por favor, tente de novo daqui a alguns minutos.
        </p>
      )}
      <button type="submit" className="botao botao-primario botao-largo" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviar"}
      </button>
    </>
  );
}
