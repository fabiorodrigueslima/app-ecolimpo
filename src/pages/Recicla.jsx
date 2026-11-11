import { Link } from "react-router-dom";
import { Cabecalho } from "../components/Comuns.jsx";
import { IconeConversa, IconeWhatsapp } from "../components/Icones.jsx";
import { VoceSabia, Depoimento } from "../components/VoceSabia.jsx";
import GuiaSeparacao from "../components/GuiaSeparacao.jsx";
import { linkWhatsapp } from "../data/contatos.js";

export default function Recicla() {
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
        <p>
          Envie sua dúvida para a equipe da Cooperativa Ecolimpo. Ela nos ajuda a melhorar as orientações para todos os
          moradores.
        </p>
        <Link to="/fale/mensagem?tipo=duvida" className="botao botao-primario botao-largo">
          Enviar minha dúvida
        </Link>
        <p className="duvida-rodape">
          Prefere uma resposta direta?{" "}
          <a href={linkWhatsapp("Olá! Tenho uma dúvida sobre a separação dos recicláveis.")} target="_blank" rel="noreferrer">
            <IconeWhatsapp tamanho={16} className="inline" /> Fale pelo WhatsApp
          </a>
        </p>
      </section>
    </div>
  );
}
