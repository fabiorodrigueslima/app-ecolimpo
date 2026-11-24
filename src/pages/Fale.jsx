import { Link } from "react-router-dom";
import { contatos, linkWhatsapp, mensagemDoMorador } from "../data/contatos.js";
import { Cabecalho } from "../components/Comuns.jsx";
import { IconeConversa, IconeEstrela, IconeSeta, IconeWhatsapp } from "../components/Icones.jsx";

export default function Fale({ condominio }) {
  return (
    <div className="pagina">
      <Cabecalho titulo="Fale com a cooperativa" subtitulo="Sua opinião ajuda a melhorar a coleta no seu condomínio." />

      <nav className="atalhos" aria-label="Opções de contato">
        <Link to="/fale/pesquisa" className="atalho">
          <span className="atalho-icone atalho-lima">
            <IconeEstrela />
          </span>
          <span>
            <strong>Pesquisa de satisfação</strong>
            <small>Dê notas de 1 a 5. Leva menos de 1 minuto.</small>
          </span>
          <IconeSeta tamanho={20} />
        </Link>
        <Link to="/fale/mensagem" className="atalho">
          <span className="atalho-icone atalho-azul">
            <IconeConversa />
          </span>
          <span>
            <strong>Enviar mensagem</strong>
            <small>Elogio, sugestão, reclamação ou dúvida</small>
          </span>
          <IconeSeta tamanho={20} />
        </Link>
      </nav>

      <section className="cartao cartao-suave" aria-labelledby="contato-titulo">
        <h2 id="contato-titulo">Outros contatos</h2>
        <a
          className="botao botao-whatsapp botao-largo"
          href={linkWhatsapp(mensagemDoMorador(condominio))}
          target="_blank"
          rel="noreferrer"
        >
          <IconeWhatsapp tamanho={20} /> WhatsApp {contatos.telefone}
        </a>
        <p className="contatos">
          <a href={`mailto:${contatos.email}`}>{contatos.email}</a>
          <br />
          <a href={contatos.instagram} target="_blank" rel="noreferrer">
            {contatos.instagramNome}
          </a>
          <br />
          <a href={contatos.site} target="_blank" rel="noreferrer">
            cooperaecolimpo.com.br
          </a>
        </p>
      </section>

      <p className="nota-centro">
        <Link to="/privacidade">Política de privacidade</Link>
      </p>
    </div>
  );
}
