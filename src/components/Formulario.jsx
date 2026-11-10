import { Link } from "react-router-dom";
import { useCondominios } from "../lib/condominios.js";
import { ENVIO_LIGADO } from "../lib/envio.js";
import { IconeCheck } from "./Icones.jsx";

// Escolha do condomínio dentro dos formulários (já vem preenchido).
export function CampoCondominio({ valor, mudar, erro }) {
  const condominios = useCondominios();
  return (
    <label className="campo">
      <span>
        Condomínio <span className="obrigatorio">(obrigatório)</span>
      </span>
      <select value={valor} onChange={(e) => mudar("condominioId", e.target.value)} required>
        <option value="">Escolha…</option>
        {condominios.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      {erro && <span className="erro">{erro}</span>}
    </label>
  );
}


export function Obrigado({ titulo }) {
  return (
    <div className="pagina obrigado">
      <span className="obrigado-icone">
        <IconeCheck tamanho={40} />
      </span>
      <h1>{titulo}</h1>
      <p>A cooperativa Ecolimpo agradece a sua participação.</p>
      {!ENVIO_LIGADO && (
        <p className="aviso-preencher" role="note">
          <strong>Versão de teste:</strong> a resposta ainda não é enviada à cooperativa. O envio será ligado na próxima
          etapa.
        </p>
      )}
      <Link to="/" className="botao botao-primario botao-largo">
        Voltar ao início
      </Link>
    </div>
  );
}

export function BotaoEnviar({ estado }) {
  return (
    <>
      {estado === "falhou" && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível enviar agora. Confira a internet e tente de novo.
        </p>
      )}
      <button type="submit" className="botao botao-primario botao-largo" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviar"}
      </button>
    </>
  );
}
