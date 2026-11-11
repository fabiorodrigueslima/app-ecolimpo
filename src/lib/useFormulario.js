import { useState } from "react";
import { useCondominioAtual } from "./condominios.js";
import { enviarResposta } from "./envio.js";
import { VERIFICACAO_LIGADA } from "./config.js";

// Cuida do estado, da conferência e do envio de um formulário.
// O formulário mostra <VerificacaoHumana key={chaveVerificacao} aoVerificar={aoVerificar} />.
export function useFormulario(inicial, validar, montar) {
  const atual = useCondominioAtual();
  const idsCondominios = atual ? [atual.id] : [];
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState({});
  // editando | enviando | enviado | falhou | limite | robo | aguarde-verificacao
  const [estado, setEstado] = useState("editando");
  const [token, setToken] = useState(null);
  const [chaveVerificacao, setChaveVerificacao] = useState(0);

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function limparErro(campo) {
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function aoVerificar(novo) {
    setToken(novo);
    if (novo) setEstado((e) => (e === "aguarde-verificacao" ? "editando" : e));
  }

  async function enviar(e) {
    e.preventDefault();
    const conferido = validar(dados, idsCondominios);
    if (!conferido.ok) {
      setErros(conferido.erros);
      requestAnimationFrame(() =>
        document.querySelector(".erro")?.closest("label, fieldset")?.scrollIntoView({ block: "center" }),
      );
      return;
    }
    if (VERIFICACAO_LIGADA && !token) {
      setEstado("aguarde-verificacao");
      return;
    }
    setEstado("enviando");
    const r = await enviarResposta(montar(dados), token).catch(() => ({ ok: false }));
    // O comprovante do anti-robô só vale uma vez: prepara outro para uma nova tentativa.
    setToken(null);
    setChaveVerificacao((k) => k + 1);
    setEstado(r.ok ? "enviado" : r.limite ? "limite" : r.robo ? "robo" : "falhou");
  }

  return {
    dados,
    mudar,
    limparErro,
    erros,
    setErros,
    estado,
    enviar,
    idsCondominios,
    aoVerificar,
    chaveVerificacao,
  };
}
