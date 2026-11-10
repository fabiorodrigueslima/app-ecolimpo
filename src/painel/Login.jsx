import { useState } from "react";
import { entrar, pedirNovaSenha } from "./api.js";

export default function Login({ aviso, aoEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState(aviso);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    if (!email.includes("@") || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }
    setOcupado(true);
    const r = await entrar(email, senha);
    setOcupado(false);
    if (r.ok) aoEntrar({ ...r.sessao, email: r.sessao.email || email.trim().toLowerCase() });
    else setErro(r.erro);
  }

  async function esqueci() {
    setErro("");
    setMensagem("");
    if (!email.includes("@")) {
      setErro("Escreva o seu e-mail no campo acima e toque de novo em “Esqueci minha senha”.");
      return;
    }
    setOcupado(true);
    const r = await pedirNovaSenha(email);
    setOcupado(false);
    if (r.status === 429) setErro("Já enviamos um e-mail há pouco. Espere alguns minutos.");
    else if (!r.ok) setErro("Não foi possível enviar o e-mail agora. Tente de novo.");
    else setMensagem("Se este e-mail for da equipe, chega uma mensagem com o link para criar uma nova senha.");
  }

  return (
    <form className="painel-caixa" onSubmit={enviar} noValidate>
      <h1>Entrar</h1>
      <p className="dica">Acesso só para a equipe da cooperativa.</p>
      {mensagem && (
        <p className="aviso-ok" role="status">
          {mensagem}
        </p>
      )}
      <label className="campo">
        <span>E-mail</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </label>
      <label className="campo">
        <span>Senha</span>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {erro && (
        <p className="erro erro-bloco" role="alert">
          {erro}
        </p>
      )}
      <button type="submit" className="botao botao-primario botao-largo" disabled={ocupado}>
        {ocupado ? "Aguarde…" : "Entrar"}
      </button>
      <button type="button" className="link-botao" onClick={esqueci} disabled={ocupado}>
        Esqueci minha senha
      </button>
    </form>
  );
}
