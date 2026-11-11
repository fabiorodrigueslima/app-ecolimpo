import { useState } from "react";
import { montarBackup, diasDesdeCopia, formatarDataHora, DIAS_PARA_NOVA_COPIA } from "./regras.js";

const CHAVE = "ecolimpo:ultima-copia";

function lerUltima() {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function baixarArquivo(nome, conteudo, tipo) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export default function Backup({ api }) {
  const [ultima, setUltima] = useState(lerUltima);
  const [estado, setEstado] = useState("parado"); // parado | gerando | pronto | erro
  const [totais, setTotais] = useState(null);
  const dias = diasDesdeCopia(ultima);
  const atrasada = dias === null || dias >= DIAS_PARA_NOVA_COPIA;

  async function gerar() {
    setEstado("gerando");
    const [respostas, condominios] = await Promise.all([api.todasAsRespostas(), api.listarCondominios()]);
    if (!respostas.ok || !condominios.ok) return setEstado("erro");
    const agora = new Date();
    const copia = montarBackup({ respostas: respostas.dados, condominios: condominios.dados, geradoEm: agora });
    baixarArquivo(
      `copia-seguranca-ecolimpo-${agora.toISOString().slice(0, 10)}.json`,
      JSON.stringify(copia, null, 2),
      "application/json",
    );
    try {
      localStorage.setItem(CHAVE, agora.toISOString());
    } catch {
      // sem armazenamento: só não lembra a data
    }
    setUltima(agora.toISOString());
    setTotais(copia.totais);
    setEstado("pronto");
  }

  return (
    <section className="painel-secao" aria-labelledby="backup-titulo">
      <h1 id="backup-titulo">Cópia de segurança</h1>
      <p className="dica">
        O plano gratuito do banco não faz cópia automática. Baixe uma cópia por mês e guarde num lugar seguro (por
        exemplo, um pen drive ou uma pasta só da cooperativa). O arquivo tem todas as respostas e os condomínios.
      </p>

      <div className={`situacao situacao-${atrasada ? "atencao" : "ok"}`} role="status">
        <strong>
          {ultima ? `Última cópia neste computador: ${formatarDataHora(ultima)}` : "Nenhuma cópia baixada neste computador"}
        </strong>
        <span>
          {atrasada
            ? "Está na hora de baixar uma cópia nova."
            : `Próxima cópia recomendada em ${DIAS_PARA_NOVA_COPIA - dias} dia(s).`}
        </span>
      </div>

      <button type="button" className="botao botao-primario" onClick={gerar} disabled={estado === "gerando"}>
        {estado === "gerando" ? "Gerando a cópia…" : "Baixar cópia de segurança"}
      </button>

      {estado === "pronto" && totais && (
        <p className="aviso-ok" role="status">
          Cópia baixada: {totais.respostas} resposta(s) e {totais.condominios} condomínio(s).
        </p>
      )}
      {estado === "erro" && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível gerar a cópia. Confira a internet e tente de novo.
        </p>
      )}

      <p className="dica">
        Atenção: o arquivo tem as respostas dos moradores. Não envie por WhatsApp nem deixe em computador de uso público.
      </p>
    </section>
  );
}
