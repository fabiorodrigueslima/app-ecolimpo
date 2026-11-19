import { useEffect, useState } from "react";
import { cadastrarAutenticador, confirmarCodigo } from "./api.js";
import { codigoValido } from "./regras.js";
import { svgDoQr } from "../lib/qr.js";

// QR do autenticador desenhado pelo próprio app (a imagem pronta do Supabase não abria).
function QrDoAutenticador({ uri, reserva }) {
  if (!uri) return <img src={reserva} alt="QR Code para o app autenticador" width="200" height="200" />;
  const { total, caminho } = svgDoQr(uri);
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width="200"
      height="200"
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR Code para o app autenticador"
    >
      <rect width={total} height={total} fill="#fff" />
      <path d={caminho} fill="#000" />
    </svg>
  );
}

// Verificação em 2 etapas: "cadastrar" (1ª vez, com QR Code) ou "codigo" (vezes seguintes).
// paraNovaSenha: veio do link de "esqueci a senha" e precisa do código antes de criar a senha.
export default function DuasEtapas({ modo, token, fatorId, aoConfirmar, aoSair, paraNovaSenha = false }) {
  const [cadastro, setCadastro] = useState(null); // { id, qr, chave }
  const [falhaCadastro, setFalhaCadastro] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mostrarChave, setMostrarChave] = useState(false);

  useEffect(() => {
    if (modo !== "cadastrar") return;
    let ativo = true;
    cadastrarAutenticador(token).then((r) => {
      if (!ativo) return;
      if (r.ok) setCadastro(r);
      else setFalhaCadastro(true);
    });
    return () => {
      ativo = false;
    };
  }, [modo, token]);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (!codigoValido(codigo)) {
      setErro("Digite os 6 números que aparecem no app autenticador.");
      return;
    }
    setOcupado(true);
    const r = await confirmarCodigo(token, modo === "cadastrar" ? cadastro.id : fatorId, codigo);
    setOcupado(false);
    if (r.ok) aoConfirmar(r.sessao);
    else {
      setErro(r.erro);
      setCodigo("");
    }
  }

  const campoCodigo = (
    <label className="campo">
      <span>Código de 6 números</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
        className="campo-codigo"
        autoFocus
      />
    </label>
  );

  return (
    <form className="painel-caixa" onSubmit={enviar} noValidate>
      {modo === "cadastrar" ? (
        <>
          <h1>Proteja o painel</h1>
          <p className="dica">
            Para entrar no painel, além da senha, vai ser preciso um código do celular. Assim, mesmo que alguém descubra a
            senha, não entra sem o celular. É só configurar uma vez.
          </p>
          <ol className="passos">
            <li>
              Instale no celular um app autenticador gratuito: <strong>Duo Mobile</strong>,{" "}
              <strong>Google Authenticator</strong> ou <strong>Microsoft Authenticator</strong>.
            </li>
            <li>No app, toque em “+” (ou “Adicionar”) e escolha “Ler código QR”.</li>
            <li>Aponte a câmera para o código abaixo.</li>
            <li>Digite aqui os 6 números que aparecerem no app.</li>
          </ol>
          {falhaCadastro && (
            <p className="erro erro-bloco" role="alert">
              Não foi possível preparar o QR Code. Recarregue a página e tente de novo.
            </p>
          )}
          {!cadastro && !falhaCadastro && <p className="carregando">Preparando o QR Code…</p>}
          {cadastro && (
            <div className="mfa-qr">
              <QrDoAutenticador uri={cadastro.uri} reserva={cadastro.qr} />
              <button type="button" className="link-botao" onClick={() => setMostrarChave((v) => !v)}>
                {mostrarChave ? "Esconder a chave" : "Não consegue ler o QR Code? Ver a chave para digitar"}
              </button>
              {mostrarChave && <code className="mfa-chave">{cadastro.chave}</code>}
            </div>
          )}
        </>
      ) : (
        <>
          <h1>Código de verificação</h1>
          <p className="dica">
            {paraNovaSenha && "Antes de criar a senha nova, confirme que é você. "}
            Abra o app autenticador no celular e digite os 6 números do “Ecolimpo Painel”.
          </p>
          <p className="dica">
            Perdeu o acesso ao app autenticador? A coordenação pode apagar o autenticador no Supabase
            (Authentication › Users › “Remove MFA factors”) e você cadastra outro.
          </p>
        </>
      )}

      {(modo === "codigo" || cadastro) && campoCodigo}
      {erro && (
        <p className="erro erro-bloco" role="alert">
          {erro}
        </p>
      )}
      {(modo === "codigo" || cadastro) && (
        <button type="submit" className="botao botao-primario botao-largo" disabled={ocupado}>
          {ocupado ? "Conferindo…" : "Confirmar"}
        </button>
      )}
      <button type="button" className="link-botao" onClick={aoSair}>
        Sair
      </button>
    </form>
  );
}
