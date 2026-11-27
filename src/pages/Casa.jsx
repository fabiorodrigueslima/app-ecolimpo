// Telas de quem mora em CASA / RUA (circuitos do SLU). Só informativo:
// a rota é do SLU; o app nunca promete coleta onde o caminhão não passa.

import { Link } from "react-router-dom";
import { NOMES_DIAS } from "../lib/coleta.js";
import { coletasDe, descreverTurno, proximasColetasDe } from "../lib/circuitos.js";
import { TURNOS } from "../data/circuitosSlu.js";
import { nomeDaCasa } from "../lib/moradia.js";
import ColetaCasa from "../components/ColetaCasa.jsx";
import AjudaSlu from "../components/AjudaSlu.jsx";
import Instalar from "../components/Instalar.jsx";
import { Cabecalho } from "../components/Comuns.jsx";
import { IconeCasa, IconeReciclar, IconeSeta } from "../components/Icones.jsx";

function LocalAtual({ casa }) {
  return (
    <div className="condominio-atual">
      <IconeCasa tamanho={22} />
      <div>
        <small>Sua área (casa / rua)</small>
        <strong>{nomeDaCasa(casa)}</strong>
      </div>
      <Link to="/condominio" className="link-pequeno">
        Trocar
      </Link>
    </div>
  );
}

// Quem escolheu "Meu bairro não está na lista".
export function ForaDaLista({ casa }) {
  return (
    <div className="pagina">
      <LocalAtual casa={casa} />
      <section className="cartao" aria-labelledby="fora-titulo">
        <h1 id="fora-titulo" className="titulo-cartao">
          Sua área não está na lista
        </h1>
        <p>
          Sua área pode ser atendida por outra cooperativa ou ainda não ter coleta seletiva. Confira no mapa oficial do
          SLU ou ligue para a Ouvidoria do SLU.
        </p>
      </section>
      <AjudaSlu casa={casa} titulo="Onde conferir" />
      <p className="nota-centro">
        Achou o seu bairro? <Link to="/condominio">Escolher de novo</Link>
      </p>
    </div>
  );
}

export function InicioCasa({ casa }) {
  if (casa.foraDaLista) return <ForaDaLista casa={casa} />;
  return (
    <div className="pagina">
      <LocalAtual casa={casa} />
      <ColetaCasa escolha={casa.escolha} />

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
      </nav>

      <AjudaSlu casa={casa} />
      <Instalar />
    </div>
  );
}

const LETRA_TURNO = { manha: "manhã", tarde: "tarde" };

export function ColetaDaCasa({ casa }) {
  if (casa.foraDaLista) return <ForaDaLista casa={casa} />;
  const { escolha } = casa;
  const coletas = coletasDe(escolha);
  const proximas = proximasColetasDe(escolha, new Date(), 4);

  return (
    <div className="pagina">
      <Cabecalho titulo="Dia da coleta" subtitulo={nomeDaCasa(casa)} />
      <ColetaCasa escolha={escolha} />

      <section className="cartao" aria-labelledby="semana-titulo">
        <h2 id="semana-titulo">Dias da semana</h2>
        <ul className="semana">
          {NOMES_DIAS.map((nome, i) => {
            const turnos = coletas.filter((c) => c.dia === i).map((c) => c.turno);
            return (
              <li key={nome} className={turnos.length ? "dia-com" : "dia-sem"}>
                <span aria-hidden="true">
                  {nome.slice(0, 3)}
                  {turnos.length > 0 && (
                    <small className="turno-dia">{turnos.map((t) => LETRA_TURNO[t]).join("/")}</small>
                  )}
                </span>
                <span className="sr">
                  {nome}: {turnos.length ? turnos.map((t) => `coleta ${descreverTurno(t)}`).join(" e ") : "sem coleta"}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="dica">
          Turnos: {descreverTurno("manha")} e {descreverTurno("tarde")}. Não tem coleta sábado, domingo nem à noite.
        </p>
      </section>

      {proximas.length > 0 && (
        <section className="cartao" aria-labelledby="proximas-titulo">
          <h2 id="proximas-titulo">Próximas datas</h2>
          <ul className="lista-datas">
            {proximas.map((c) => (
              <li key={`${c.ano}-${c.mes}-${c.dia}-${c.turno}`}>
                <span>
                  {c.diasAte === 0
                    ? "Hoje"
                    : c.diasAte === 1
                      ? "Amanhã"
                      : `${NOMES_DIAS[c.diaSemana][0].toUpperCase()}${NOMES_DIAS[c.diaSemana].slice(1)}, ${String(c.dia).padStart(2, "0")}/${String(c.mes).padStart(2, "0")}`}
                </span>
                <strong>{TURNOS[c.turno].nome[0].toUpperCase() + TURNOS[c.turno].nome.slice(1)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AjudaSlu casa={casa} />

      <p className="nota-centro">
        Mudou de endereço? <Link to="/condominio">Trocar local</Link>
      </p>
    </div>
  );
}
