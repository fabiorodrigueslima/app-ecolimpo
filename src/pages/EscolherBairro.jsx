import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AREAS } from "../data/circuitosSlu.js";
import { areasPorGrupo } from "../lib/circuitos.js";
import { contar } from "../lib/contagem.js";
import { FORA_DA_LISTA } from "../lib/moradia.js";

// Lista dos bairros/áreas atendidos pela coleta seletiva do SLU (feita pela Ecolimpo).
// Bairro dividido (ex.: Residencial Oeste) pede também a quadra ou a rua.
export default function EscolherBairro({ aoEscolher, aoVoltar }) {
  const [areaId, setAreaId] = useState("");
  const [parteId, setParteId] = useState("");
  const navegar = useNavigate();
  const area = AREAS.find((a) => a.id === areaId) ?? null;

  const escolhaFinal = areaId === FORA_DA_LISTA ? FORA_DA_LISTA : area?.partes ? parteId : areaId;

  // Bairro dividido: rola a tela até a pergunta da quadra/rua (senão ela fica escondida lá embaixo).
  const caixaDaParte = useRef(null);
  useEffect(() => {
    if (area?.partes) caixaDaParte.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [area]);

  function marcarArea(id) {
    setAreaId(id);
    setParteId("");
  }

  function confirmar(e) {
    e.preventDefault();
    if (!escolhaFinal) return;
    if (escolhaFinal === FORA_DA_LISTA) contar("fora_da_lista", { tipo: "bairro", id: FORA_DA_LISTA });
    else contar("escolha_bairro", { tipo: "bairro", id: escolhaFinal });
    aoEscolher(escolhaFinal);
    navegar("/");
  }

  return (
    <form onSubmit={confirmar} className="pagina">
      <div className="boas-vindas">
        <p className="sobretitulo">Coleta seletiva nas casas</p>
        <h1>Qual é o seu bairro?</h1>
        <p>Toque no seu bairro ou área. A escolha fica salva só neste celular.</p>
      </div>

      {areasPorGrupo().map(({ grupo, areas }) => (
        <fieldset key={grupo} className="lista-opcoes">
          <legend className="grupo-titulo">{grupo}</legend>
          {areas.map((a) => (
            <label key={a.id} className={`opcao ${areaId === a.id ? "opcao-marcada" : ""}`}>
              <input
                type="radio"
                name="bairro"
                value={a.id}
                checked={areaId === a.id}
                onChange={() => marcarArea(a.id)}
              />
              <span className="opcao-texto">
                <strong>{a.nome}</strong>
                {a.partes && <small>Depois escolha {a.pergunta?.includes("rua") ? "a rua" : "a quadra"}</small>}
              </span>
            </label>
          ))}
        </fieldset>
      ))}

      {area?.partes && (
        <fieldset ref={caixaDaParte} className="lista-opcoes parte-do-bairro" aria-live="polite">
          <legend className="grupo-titulo">
            {area.nome}: {area.pergunta}
          </legend>
          {area.partes.map((p) => (
            <label key={p.id} className={`opcao ${parteId === p.id ? "opcao-marcada" : ""}`}>
              <input
                type="radio"
                name="parte"
                value={p.id}
                checked={parteId === p.id}
                onChange={() => setParteId(p.id)}
              />
              <span className="opcao-texto">
                <strong>{p.nome}</strong>
              </span>
            </label>
          ))}
          <label className={`opcao ${parteId === FORA_DA_LISTA ? "opcao-marcada" : ""}`}>
            <input
              type="radio"
              name="parte"
              value={FORA_DA_LISTA}
              checked={parteId === FORA_DA_LISTA}
              onChange={() => setParteId(FORA_DA_LISTA)}
            />
            <span className="opcao-texto">
              <strong>
                {area.pergunta?.includes("rua") ? "Minha rua não está aqui" : "Minha quadra não está aqui"}
              </strong>
            </span>
          </label>
        </fieldset>
      )}

      <fieldset className="lista-opcoes">
        <legend className="sr">Outra área</legend>
        <label className={`opcao ${areaId === FORA_DA_LISTA ? "opcao-marcada" : ""}`}>
          <input
            type="radio"
            name="bairro"
            value={FORA_DA_LISTA}
            checked={areaId === FORA_DA_LISTA}
            onChange={() => marcarArea(FORA_DA_LISTA)}
          />
          <span className="opcao-texto">
            <strong>Meu bairro não está na lista</strong>
          </span>
        </label>
      </fieldset>

      <div className="rodape-fixo">
        <button type="submit" className="botao botao-primario botao-largo" disabled={!escolhaFinal}>
          Confirmar
        </button>
      </div>

      {aoVoltar && (
        <p className="nota-centro">
          <button type="button" className="link-botao" onClick={aoVoltar}>
            Voltar: moro em condomínio
          </button>
        </p>
      )}
    </form>
  );
}
