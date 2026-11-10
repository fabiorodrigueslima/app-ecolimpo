import { Link } from "react-router-dom";
import { formatarHorario, proximasColetas, rotuloDaColeta, NOMES_DIAS } from "../lib/coleta.js";
import ProximaColeta from "../components/ProximaColeta.jsx";
import { AvisoPreencher, Cabecalho } from "../components/Comuns.jsx";
import { IconeSino } from "../components/Icones.jsx";

export default function Coleta({ condominio }) {
  const proximas = proximasColetas(condominio, new Date(), 4);

  return (
    <div className="pagina">
      <Cabecalho titulo="Dia da coleta" subtitulo={condominio.nome} />
      {condominio.exemplo && <AvisoPreencher>Dia e horário de exemplo, ainda não são os reais.</AvisoPreencher>}

      <ProximaColeta condominio={condominio} />

      <section className="cartao" aria-labelledby="semana-titulo">
        <h2 id="semana-titulo">Dias da semana</h2>
        <ul className="semana">
          {NOMES_DIAS.map((nome, i) => {
            const tem = condominio.dias.includes(i);
            return (
              <li key={nome} className={tem ? "dia-com" : "dia-sem"}>
                <span aria-hidden="true">{nome.slice(0, 3)}</span>
                <span className="sr">
                  {nome}: {tem ? `com coleta às ${formatarHorario(condominio.horario)}` : "sem coleta"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {proximas.length > 0 && (
        <section className="cartao" aria-labelledby="proximas-titulo">
          <h2 id="proximas-titulo">Próximas datas</h2>
          <ul className="lista-datas">
            {proximas.map((c) => (
              <li key={`${c.ano}-${c.mes}-${c.dia}`}>
                <span>{rotuloDaColeta(c)}</span>
                <strong>{formatarHorario(condominio.horario)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cartao cartao-suave" aria-labelledby="lembrete-titulo">
        <h2 id="lembrete-titulo">
          <IconeSino tamanho={20} /> Lembrete no celular
        </h2>
        <p>
          Em breve: um aviso no seu celular às 6h30 do dia da coleta, para você não esquecer de colocar os recicláveis
          para fora.
        </p>
      </section>

      <p className="nota-centro">
        Mudou de condomínio? <Link to="/condominio">Trocar condomínio</Link>
      </p>
    </div>
  );
}
