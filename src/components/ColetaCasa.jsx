import { CONFERIDO_EM, SLU } from "../data/circuitosSlu.js";
import { descreverColetas, proximaColetaDe, rotuloDaProxima, textoCircuitos } from "../lib/circuitos.js";
import { IconeCalendario } from "./Icones.jsx";

// "2026-11-27" -> "27/11/2026"
const dataBr = (iso) => iso.split("-").reverse().join("/");

// Cartão grande com a coleta da casa / rua (circuito do SLU). Só informativo.
export default function ColetaCasa({ escolha, agora = new Date() }) {
  const proxima = proximaColetaDe(escolha, agora);
  const ehHoje = proxima?.diasAte === 0;

  return (
    <section className={`cartao cartao-coleta ${ehHoje ? "cartao-hoje" : ""}`} aria-labelledby="proxima-titulo">
      <p className="sobretitulo">Próxima coleta seletiva</p>
      <h2 id="proxima-titulo" className="coleta-dia">
        {rotuloDaProxima(proxima)}
      </h2>
      <p className="coleta-dias">
        <span aria-hidden="true">🚛</span> {descreverColetas(escolha)}
      </p>
      <p className="coleta-alerta">Coloque o material na calçada antes do horário da coleta.</p>
      <p className="fonte-slu">
        <IconeCalendario tamanho={14} /> Fonte: {SLU.nome} — {textoCircuitos(escolha)}
        {CONFERIDO_EM && ` · conferido em ${dataBr(CONFERIDO_EM)}`}
      </p>
    </section>
  );
}
