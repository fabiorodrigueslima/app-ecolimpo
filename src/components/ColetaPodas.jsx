import { Link } from "react-router-dom";
import { diasDePoda, descreverDias, formatarHorario, proximaPoda, rotuloDaColeta } from "../lib/coleta.js";
import { regrasPoda, podasColetamos, podasNaoColetamos } from "../data/podas.js";
import { IconeMaterial, IconeLixeira } from "./IconesMateriais.jsx";

function Coluna({ grupo, tipo, icone }) {
  const id = `podas-${tipo}`;
  return (
    <section className={`guia-coluna guia-${tipo}`} aria-labelledby={id}>
      <header className="guia-topo">
        <span className="guia-topo-icone">{icone}</span>
        <div>
          <h3 id={id}>{grupo.titulo}</h3>
          <p>{grupo.explicacao}</p>
        </div>
      </header>
      <ul className="guia-itens">
        {grupo.itens.map((item) => (
          <li key={item.nome}>
            <span className="guia-item-icone">
              <IconeMaterial nome={item.icone} />
            </span>
            {item.nome}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Cartão da coleta de podas: só aparece no condomínio que tem dia de poda.
// resumo = só a próxima data (tela Início); sem resumo = com as regras (tela Coleta).
export default function ColetaPodas({ condominio, resumo = false, agora = new Date() }) {
  const dias = diasDePoda(condominio);
  if (dias.length === 0) return null;
  const proxima = proximaPoda(condominio, agora);
  const ehHoje = proxima?.diasAte === 0;

  return (
    <section className={`cartao cartao-podas ${ehHoje ? "cartao-podas-hoje" : ""}`} aria-labelledby="podas-titulo">
      <p className="sobretitulo">Próxima coleta de podas</p>
      <h2 id="podas-titulo" className="podas-dia">
        {proxima ? rotuloDaColeta(proxima) : "A PREENCHER"}
      </h2>
      <p className="podas-quando">
        Toda {descreverDias(dias)}, às {formatarHorario(condominio.horario)}. Galhos, grama e folhas (não é dia de
        recicláveis).
      </p>

      {resumo && (
        <Link to="/coleta" className="link-pequeno">
          Ver as regras da poda
        </Link>
      )}

      {!resumo && (
        <>
          <h3 className="podas-subtitulo">Atenção às regras</h3>
          <ol className="podas-regras">
            {regrasPoda.map((regra) => (
              <li key={regra.texto} className={regra.alerta ? "podas-regra-alerta" : ""}>
                <span className="guia-item-icone" aria-hidden="true">
                  <IconeMaterial nome={regra.icone} />
                </span>
                <span>{regra.texto}</span>
              </li>
            ))}
          </ol>
          <div className="guia-separacao">
            <Coluna grupo={podasColetamos} tipo="sim" icone={<IconeMaterial nome="galho" tamanho={26} />} />
            <Coluna grupo={podasNaoColetamos} tipo="nao" icone={<IconeLixeira />} />
          </div>
        </>
      )}
    </section>
  );
}
