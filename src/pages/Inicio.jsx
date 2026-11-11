import { Link } from "react-router-dom";
import ProximaColeta from "../components/ProximaColeta.jsx";
import Instalar from "../components/Instalar.jsx";
import { AvisoPreencher } from "../components/Comuns.jsx";
import { IconePredio, IconeReciclar, IconeConversa, IconeSeta, IconeEstrela } from "../components/Icones.jsx";

export default function Inicio({ condominio }) {
  return (
    <div className="pagina">
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

      {condominio.exemplo && <AvisoPreencher>Dia e horário de exemplo, ainda não são os reais.</AvisoPreencher>}

      <ProximaColeta condominio={condominio} />

      <nav className="atalhos" aria-label="Atalhos">
        <Link to="/recicla" className="atalho">
          <span className="atalho-icone atalho-verde">
            <IconeReciclar />
          </span>
          <span>
            <strong>Recicla ou não recicla?</strong>
            <small>Veja o que separar para a coleta seletiva</small>
          </span>
          <IconeSeta tamanho={20} />
        </Link>
        <Link to="/fale/pesquisa" className="atalho">
          <span className="atalho-icone atalho-lima">
            <IconeEstrela />
          </span>
          <span>
            <strong>Avalie a coleta</strong>
            <small>Pesquisa rápida de satisfação</small>
          </span>
          <IconeSeta tamanho={20} />
        </Link>
        <Link to="/fale/mensagem" className="atalho">
          <span className="atalho-icone atalho-azul">
            <IconeConversa />
          </span>
          <span>
            <strong>Fale com a cooperativa</strong>
            <small>Elogio, sugestão, reclamação ou dúvida</small>
          </span>
          <IconeSeta tamanho={20} />
        </Link>
      </nav>

      <Instalar />
    </div>
  );
}
