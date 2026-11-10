import { descreverDias, formatarHorario, periodoDoHorario, proximaColeta, rotuloDaColeta } from "../lib/coleta.js";
import { IconeCalendario, IconeRelogio } from "./Icones.jsx";

// Cartão grande com a próxima coleta do condomínio.
export default function ProximaColeta({ condominio, agora = new Date() }) {
  const proxima = proximaColeta(condominio, agora);
  const ehHoje = proxima?.diasAte === 0;

  return (
    <section className={`cartao cartao-coleta ${ehHoje ? "cartao-hoje" : ""}`} aria-labelledby="proxima-titulo">
      <p className="sobretitulo">Próxima coleta seletiva</p>
      {proxima ? (
        <>
          <h2 id="proxima-titulo" className="coleta-dia">{rotuloDaColeta(proxima)}</h2>
          <p className="coleta-hora">
            <IconeRelogio tamanho={20} /> A coleta passa às <strong>{formatarHorario(condominio.horario)}</strong> (
            {periodoDoHorario(condominio.horario)})
          </p>
          {ehHoje && <p className="coleta-alerta">Coloque os recicláveis para fora antes desse horário.</p>}
          <p className="coleta-dias">
            <IconeCalendario tamanho={18} /> Toda {descreverDias(condominio.dias)}
          </p>
        </>
      ) : (
        <h2 id="proxima-titulo" className="coleta-dia">A PREENCHER</h2>
      )}
    </section>
  );
}
