import { SLU } from "../data/circuitosSlu.js";
import { contatos, linkWhatsapp, mensagemDoMorador } from "../data/contatos.js";
import { contar } from "../lib/contagem.js";
import { localDaCasa } from "../lib/moradia.js";
import { IconeMapa, IconeTelefone, IconeWhatsapp } from "./Icones.jsx";

// Botões de ajuda para quem mora em casa / rua (a rota é do SLU, não da cooperativa).
// Cada toque soma +1 nos contadores (sem dados pessoais).
export default function AjudaSlu({ casa, titulo = "A coleta não passou?" }) {
  const local = localDaCasa(casa);
  return (
    <section className="cartao ajuda-slu" aria-labelledby="ajuda-slu-titulo">
      <h2 id="ajuda-slu-titulo">{titulo}</h2>
      <p>
        A rota é definida pelo SLU. Fale com a Ouvidoria pelo <strong>{SLU.ouvidoria}</strong>.
      </p>
      <div className="ajuda-slu-botoes">
        <a
          className="botao botao-primario botao-largo"
          href={SLU.ouvidoriaLink}
          aria-label={`Ligar para a Ouvidoria do SLU, telefone ${SLU.ouvidoria}`}
          onClick={() => contar("ouvidoria", local)}
        >
          <IconeTelefone tamanho={20} /> Ligar para a Ouvidoria SLU {SLU.ouvidoria}
        </a>
        <a
          className="botao botao-secundario botao-largo"
          href={linkWhatsapp(mensagemDoMorador(casa))}
          target="_blank"
          rel="noreferrer"
          aria-label={`Falar com a cooperativa pelo WhatsApp ${contatos.telefone} (abre o WhatsApp)`}
          onClick={() => contar("whatsapp", local)}
        >
          <IconeWhatsapp tamanho={20} /> Falar com a cooperativa
        </a>
        <a
          className="botao botao-secundario botao-largo"
          href={SLU.mapa}
          target="_blank"
          rel="noreferrer"
          aria-label="Ver no mapa oficial do SLU (abre o site do SLU)"
          onClick={() => contar("mapa_slu", local)}
        >
          <IconeMapa tamanho={20} /> Ver no mapa oficial do SLU
        </a>
      </div>
    </section>
  );
}
