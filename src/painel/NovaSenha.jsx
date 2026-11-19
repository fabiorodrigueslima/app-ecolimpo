import { useState } from "react";
import { definirSenha } from "./api.js";
import { validarNovaSenha } from "./regras.js";
import CampoSenha from "./CampoSenha.jsx";

// Aberta pelo link do e-mail ("esqueci a senha" ou convite).
export default function NovaSenha({ sessao, aoTerminar }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const problema = validarNovaSenha(senha, confirmacao);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado(true);
    const r = await definirSenha(sessao.token, senha);
    setOcupado(false);
    if (r.ok) aoTerminar();
    else setErro(r.erro);
  }

  return (
    <form className="painel-caixa" onSubmit={enviar} noValidate>
      <h1>Criar nova senha</h1>
      <p className="dica">Use pelo menos 8 caracteres, misturando letras e números.</p>
      <CampoSenha rotulo="Nova senha" valor={senha} aoMudar={setSenha} />
      <CampoSenha rotulo="Repita a nova senha" valor={confirmacao} aoMudar={setConfirmacao} />
      {erro && (
        <p className="erro erro-bloco" role="alert">
          {erro}
        </p>
      )}
      <button type="submit" className="botao botao-primario botao-largo" disabled={ocupado}>
        {ocupado ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
