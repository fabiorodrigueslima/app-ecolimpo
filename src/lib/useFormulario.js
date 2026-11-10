import { useState } from "react";
import { condominios } from "../data/condominios.js";
import { enviarResposta } from "./envio.js";

const idsCondominios = condominios.map((c) => c.id);

// Cuida do estado, da conferência e do envio de um formulário.
export function useFormulario(inicial, validar, montar) {
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState({});
  const [estado, setEstado] = useState("editando"); // editando | enviando | enviado | falhou

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function limparErro(campo) {
    setErros((e) => ({ ...e, [campo]: undefined }));
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
    setEstado("enviando");
    const r = await enviarResposta(montar(dados)).catch(() => ({ ok: false }));
    setEstado(r.ok ? "enviado" : "falhou");
  }

  return { dados, mudar, limparErro, erros, estado, enviar };
}
