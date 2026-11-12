import { Link } from "react-router-dom";
import { diasDePoda, formatarHorario, proximasColetasComTipo, rotuloDaColeta, NOMES_DIAS } from "../lib/coleta.js";
import ProximaColeta from "../components/ProximaColeta.jsx";
import ColetaPodas from "../components/ColetaPodas.jsx";
import { AvisoPreencher, Cabecalho } from "../components/Comuns.jsx";
import Lembrete from "../components/Lembrete.jsx";

const NOME_TIPO = { reciclaveis: "Recicláveis", podas: "Podas" };

export default function Coleta({ condominio }) {
  const temPoda = diasDePoda(condominio).length > 0;
  const proximas = proximasColetasComTipo(condominio, new Date(), 4);

  return (
    <div className="pagina">
      <Cabecalho titulo="Dia da coleta" subtitulo={condominio.nome} />
      {condominio.exemplo && <AvisoPreencher>Dia e horário de exemplo, ainda não são os reais.</AvisoPreencher>}

      <ProximaColeta condominio={condominio} />
      <ColetaPodas condominio={condominio} />

      <section className="cartao" aria-labelledby="semana-titulo">
        <h2 id="semana-titulo">Dias da semana</h2>
        <ul className="semana">
          {NOMES_DIAS.map((nome, i) => {
            const reciclavel = condominio.dias.includes(i);
            const poda = diasDePoda(condominio).includes(i);
            const classe = reciclavel && poda ? "dia-com dia-poda-tambem" : reciclavel ? "dia-com" : poda ? "dia-poda" : "dia-sem";
            const oQue = [reciclavel && "coleta seletiva", poda && "coleta de podas"].filter(Boolean).join(" e ");
            return (
              <li key={nome} className={classe}>
                <span aria-hidden="true">{nome.slice(0, 3)}</span>
                <span className="sr">
                  {nome}: {oQue ? `${oQue} às ${formatarHorario(condominio.horario)}` : "sem coleta"}
                </span>
              </li>
            );
          })}
        </ul>
        {temPoda && (
          <p className="legenda-semana" aria-hidden="true">
            <span className="legenda-cor dia-com" /> Recicláveis <span className="legenda-cor dia-poda" /> Podas
          </p>
        )}
      </section>

      {proximas.length > 0 && (
        <section className="cartao" aria-labelledby="proximas-titulo">
          <h2 id="proximas-titulo">Próximas datas</h2>
          <ul className="lista-datas">
            {proximas.map((c) => (
              <li key={`${c.ano}-${c.mes}-${c.dia}`}>
                <span>
                  {rotuloDaColeta(c)}
                  {temPoda && <small className="tipo-coleta"> · {c.tipos.map((t) => NOME_TIPO[t]).join(" e ")}</small>}
                </span>
                <strong>{formatarHorario(condominio.horario)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Lembrete condominio={condominio} />

      <p className="nota-centro">
        Mudou de condomínio? <Link to="/condominio">Trocar condomínio</Link>
      </p>
    </div>
  );
}
