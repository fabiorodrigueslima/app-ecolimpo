import { Link } from "react-router-dom";
import { Cabecalho } from "../components/Comuns.jsx";
import { IconeConversa, IconeWhatsapp } from "../components/Icones.jsx";
import { VoceSabia, Depoimento } from "../components/VoceSabia.jsx";
import GuiaSeparacao from "../components/GuiaSeparacao.jsx";
import { linkWhatsapp, mensagemDoMorador } from "../data/contatos.js";
import { contar } from "../lib/contagem.js";
import { localDaCasa } from "../lib/moradia.js";

// casa: quem mora em casa / rua — a dúvida vai só pelo WhatsApp (o envio de mensagem é dos condomínios).
export default function Recicla({ condominio, casa = null }) {
  const local = casa ?? condominio;
  const lugar = casa ? localDaCasa(casa) : condominio;
  const linkDoWhatsapp = linkWhatsapp(mensagemDoMorador(local, "Tenho uma dúvida sobre a separação dos recicláveis."));

  return (
    <div className="pagina">
      <Cabecalho titulo="Recicla ou não recicla?" />

      <VoceSabia />
      <Depoimento />

      <h2 className="titulo-secao">O que a cooperativa recicla e o que não recicla</h2>
      <GuiaSeparacao />

      <section className="cartao duvida-material" aria-labelledby="duvida-titulo">
        <span className="duvida-icone">
          <IconeConversa tamanho={26} />
        </span>
        <h2 id="duvida-titulo">Ficou com dúvida sobre algum material?</h2>
        {casa ? (
          <>
            <p>Pergunte para a equipe da Cooperativa Ecolimpo pelo WhatsApp.</p>
            <a
              className="botao botao-primario botao-largo"
              href={linkDoWhatsapp}
              onClick={() => contar("whatsapp", lugar)}
              target="_blank"
              rel="noreferrer"
              aria-label="Tirar dúvida com a cooperativa pelo WhatsApp (abre o WhatsApp)"
            >
              <IconeWhatsapp tamanho={20} /> Tirar dúvida pelo WhatsApp
            </a>
          </>
        ) : (
          <>
            <p>
              Envie sua dúvida para a equipe da Cooperativa Ecolimpo. Ela nos ajuda a melhorar as orientações para todos
              os moradores.
            </p>
            <Link to="/fale/mensagem?tipo=duvida" className="botao botao-primario botao-largo">
              Enviar minha dúvida
            </Link>
            <p className="duvida-rodape">
              Prefere uma resposta direta?{" "}
              <a href={linkDoWhatsapp} onClick={() => contar("whatsapp", lugar)} target="_blank" rel="noreferrer">
                <IconeWhatsapp tamanho={16} className="inline" /> Fale pelo WhatsApp
              </a>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
