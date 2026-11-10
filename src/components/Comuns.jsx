import { Link } from "react-router-dom";
import { IconeVoltar } from "./Icones.jsx";

// Aviso amarelo para dados que a cooperativa ainda vai enviar.
export function AvisoPreencher({ children }) {
  return (
    <p className="aviso-preencher" role="note">
      <strong>A PREENCHER</strong> {children}
    </p>
  );
}

export function Cabecalho({ titulo, subtitulo, voltar }) {
  return (
    <div className="cabecalho">
      {voltar && (
        <Link to={voltar} className="voltar">
          <IconeVoltar tamanho={18} /> Voltar
        </Link>
      )}
      <h1>{titulo}</h1>
      {subtitulo && <p className="cabecalho-sub">{subtitulo}</p>}
    </div>
  );
}

// Campos opcionais de identificação (nome e apartamento).
export function CamposOpcionais({ dados, mudar, erros }) {
  return (
    <fieldset className="grupo">
      <legend>
        Quer se identificar? <span className="opcional">(opcional)</span>
      </legend>
      <p className="dica">Você pode enviar sem nome. Só o condomínio é necessário.</p>
      <div className="linha-2">
        <label className="campo">
          <span>Nome</span>
          <input
            type="text"
            value={dados.nome}
            onChange={(e) => mudar("nome", e.target.value)}
            maxLength={80}
            autoComplete="given-name"
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </label>
        <label className="campo">
          <span>Apartamento / casa</span>
          <input
            type="text"
            value={dados.apartamento}
            onChange={(e) => mudar("apartamento", e.target.value)}
            maxLength={20}
            inputMode="text"
          />
          {erros.apartamento && <span className="erro">{erros.apartamento}</span>}
        </label>
      </div>
    </fieldset>
  );
}
