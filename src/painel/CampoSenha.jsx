import { useState } from "react";
import { IconeOlho, IconeOlhoFechado } from "../components/Icones.jsx";

// Campo de senha com um olho para mostrar/ocultar o que foi digitado.
export default function CampoSenha({ rotulo, valor, aoMudar, autoComplete = "new-password", obrigatorio = false }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <label className="campo">
      <span>{rotulo}</span>
      <span className="campo-senha">
        <input
          type={visivel ? "text" : "password"}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoComplete={autoComplete}
          required={obrigatorio}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="botao-olho"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? `Ocultar ${rotulo.toLowerCase()}` : `Mostrar ${rotulo.toLowerCase()}`}
          aria-pressed={visivel}
          title={visivel ? "Ocultar senha" : "Mostrar senha"}
        >
          {visivel ? <IconeOlhoFechado tamanho={22} /> : <IconeOlho tamanho={22} />}
        </button>
      </span>
    </label>
  );
}
