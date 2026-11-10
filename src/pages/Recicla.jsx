import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { materiais } from "../data/materiais.js";
import { buscarMateriais, RESPOSTAS } from "../lib/busca.js";
import { AvisoPreencher, Cabecalho } from "../components/Comuns.jsx";
import { IconeBusca } from "../components/Icones.jsx";

export default function Recicla() {
  const [termo, setTermo] = useState("");
  const resultado = useMemo(() => buscarMateriais(materiais, termo), [termo]);
  const temExemplo = materiais.some((m) => m.exemplo);

  return (
    <div className="pagina">
      <Cabecalho titulo="Recicla ou não recicla?" subtitulo="Digite o nome do material, por exemplo: caixa de pizza." />
      {temExemplo && <AvisoPreencher>A lista oficial da cooperativa ainda vai ser cadastrada.</AvisoPreencher>}

      <label className="campo-busca">
        <IconeBusca tamanho={20} />
        <span className="sr">Buscar material</span>
        <input
          type="search"
          placeholder="Buscar material"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      <p className="sr" aria-live="polite">
        {resultado.length} {resultado.length === 1 ? "material encontrado" : "materiais encontrados"}
      </p>

      <ul className="materiais">
        {resultado.map((m) => {
          const r = RESPOSTAS[m.recicla];
          return (
            <li key={m.nome} className={`material material-${r.classe}`}>
              <div className="material-topo">
                <h2>{m.nome}</h2>
                <span className={`selo selo-${r.classe}`}>{r.rotulo}</span>
              </div>
              {m.categoria && <small className="material-categoria">{m.categoria}</small>}
              <p>
                <strong>{m.recicla === "nao" ? "Por quê: " : "Como preparar: "}</strong>
                {m.preparo}
              </p>
            </li>
          );
        })}
      </ul>

      {resultado.length === 0 && (
        <div className="cartao cartao-suave">
          <p>
            Não encontramos “{termo}”. <Link to="/fale/mensagem">Pergunte à cooperativa</Link> e a gente responde.
          </p>
        </div>
      )}
    </div>
  );
}
