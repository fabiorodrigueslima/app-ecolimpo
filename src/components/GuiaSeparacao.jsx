import { reciclaveis, naoReciclaveis } from "../data/separacao.js";
import { IconeMaterial, IconeLixeira } from "./IconesMateriais.jsx";
import { IconeReciclar } from "./Icones.jsx";

function Coluna({ grupo, tipo, Icone }) {
  const id = `guia-${tipo}`;
  return (
    <section className={`guia-coluna guia-${tipo}`} aria-labelledby={id}>
      <header className="guia-topo">
        <span className="guia-topo-icone">
          <Icone tamanho={26} />
        </span>
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

// Duas colunas: o que vai para a coleta seletiva e o que não vai.
export default function GuiaSeparacao() {
  return (
    <div className="guia-separacao">
      <Coluna grupo={reciclaveis} tipo="sim" Icone={IconeReciclar} />
      <Coluna grupo={naoReciclaveis} tipo="nao" Icone={IconeLixeira} />
    </div>
  );
}
