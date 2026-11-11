import { paises, notaMetodologia, depoimento } from "../data/reciclagemMundo.js";
import { formatarPorcentagem, ordenarPaises, frasesDoQuadro, fontesUnicas, depoimentoPreenchido } from "../lib/voceSabia.js";
import { AvisoPreencher } from "./Comuns.jsx";

// Quadro com a comparação da reciclagem entre países.
export function VoceSabia() {
  const frases = frasesDoQuadro(paises);
  if (!frases) return null;

  return (
    <section className="cartao voce-sabia" aria-labelledby="voce-sabia-titulo">
      <p className="sobretitulo">Você sabia?</p>
      <h2 id="voce-sabia-titulo">{frases.titulo}</h2>
      <p className="voce-sabia-sub">{frases.comparacao}</p>

      <ul className="barras" aria-label="Quanto do lixo das cidades cada país recicla">
        {ordenarPaises(paises).map((p) => (
          <li key={p.nome} className={p.destaque ? "barra barra-destaque" : "barra"}>
            <span className="barra-nome">{p.nome}</span>
            <span className="barra-trilho" aria-hidden="true">
              <span className="barra-valor" style={{ width: `${Math.max(p.porcentagem, 2)}%` }} />
            </span>
            <span className="barra-numero">{formatarPorcentagem(p.porcentagem)}</span>
          </li>
        ))}
      </ul>

      <details className="fontes">
        <summary>De onde vêm esses números?</summary>
        <p>{notaMetodologia}</p>
        <ul>
          {fontesUnicas(paises).map((f) => (
            <li key={f.link}>
              <a href={f.link} target="_blank" rel="noreferrer">
                {f.fonte}
              </a>{" "}
              (dados de {f.anos})
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

// Frase de um catador ou catadora da cooperativa.
export function Depoimento() {
  if (!depoimentoPreenchido(depoimento)) {
    return <AvisoPreencher>Aqui vai a frase de um catador ou catadora da cooperativa.</AvisoPreencher>;
  }
  return (
    <figure className="depoimento">
      <blockquote>“{depoimento.texto}”</blockquote>
      {depoimento.autor && !/A PREENCHER/.test(depoimento.autor) && (
        <figcaption>
          — {depoimento.autor}
          {depoimento.funcao && <span>, {depoimento.funcao}</span>}
        </figcaption>
      )}
    </figure>
  );
}
