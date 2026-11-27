import { useState } from "react";
import { Link } from "react-router-dom";
import EscolherCondominio from "./EscolherCondominio.jsx";
import EscolherBairro from "./EscolherBairro.jsx";
import { Cabecalho } from "../components/Comuns.jsx";
import { IconeCasa, IconePredio, IconeSeta } from "../components/Icones.jsx";

// "Onde você mora?" -> [Em condomínio] continua como sempre; [Em casa / na rua] abre a lista de bairros.
// Quem chega pelo QR Code do condomínio (?c=) pula a pergunta.
export default function EscolherMoradia({
  primeiraVez = false,
  idDoLink = null,
  condominioAtual,
  nomeAtual,
  aoEscolherCondominio,
  aoEscolherCasa,
}) {
  const [passo, setPasso] = useState(idDoLink ? "condominio" : "pergunta");

  if (passo === "condominio") {
    return (
      <>
        <EscolherCondominio
          atual={condominioAtual}
          aoEscolher={aoEscolherCondominio}
          primeiraVez={primeiraVez}
          idDoLink={idDoLink}
        />
        {!idDoLink && (
          <p className="nota-centro">
            <button type="button" className="link-botao" onClick={() => setPasso("pergunta")}>
              Voltar: moro em casa / na rua
            </button>
          </p>
        )}
      </>
    );
  }

  if (passo === "casa") return <EscolherBairro aoEscolher={aoEscolherCasa} aoVoltar={() => setPasso("pergunta")} />;

  return (
    <div className="pagina">
      {primeiraVez ? (
        <div className="boas-vindas">
          <p className="sobretitulo">Bem-vindo(a)!</p>
          <h1>Onde você mora?</h1>
          <p>Assim o app mostra o dia certo da sua coleta seletiva. A escolha fica salva só neste celular.</p>
        </div>
      ) : (
        <>
          <Cabecalho titulo="Trocar local" voltar="/" />
          {nomeAtual && (
            <div className="condominio-atual">
              <div>
                <small>Local atual</small>
                <strong>{nomeAtual}</strong>
              </div>
            </div>
          )}
          <h2 className="titulo-secao">Onde você mora?</h2>
        </>
      )}

      <nav className="atalhos escolha-moradia" aria-label="Onde você mora">
        <button type="button" className="atalho" onClick={() => setPasso("condominio")}>
          <span className="atalho-icone atalho-azul">
            <IconePredio />
          </span>
          <span>
            <strong>Em condomínio</strong>
            <small>Prédio ou condomínio atendido pela cooperativa</small>
          </span>
          <IconeSeta tamanho={20} />
        </button>
        <button type="button" className="atalho" onClick={() => setPasso("casa")}>
          <span className="atalho-icone atalho-verde">
            <IconeCasa />
          </span>
          <span>
            <strong>Em casa / na rua</strong>
            <small>São Sebastião, Jardins Mangueiral e Jardim Botânico III</small>
          </span>
          <IconeSeta tamanho={20} />
        </button>
      </nav>

      <p className="nota-centro">
        <Link to="/privacidade">Política de privacidade</Link>
      </p>
    </div>
  );
}
