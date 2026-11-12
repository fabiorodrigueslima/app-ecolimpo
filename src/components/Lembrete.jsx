import { useEffect, useState } from "react";
import { formatarHorario } from "../lib/coleta.js";
import { situacaoDoAparelho, lembreteLigado, ligarLembrete, desligarLembrete } from "../lib/lembrete.js";
import { IconeSino, IconeCompartilhar, IconeCheck } from "./Icones.jsx";
import VerificacaoHumana from "./VerificacaoHumana.jsx";
import { VERIFICACAO_LIGADA } from "../lib/config.js";

const ERROS = {
  recusado: "Você não permitiu as notificações. Toque em “Ligar lembrete” de novo e escolha “Permitir”.",
  bloqueado: "As notificações estão bloqueadas neste celular. Veja abaixo como liberar.",
  rede: "Não foi possível ligar agora. Confira a internet e tente de novo.",
  limite: "Muitas pessoas estão ligando o lembrete agora. Tente de novo daqui a alguns minutos.",
  erro: "Não foi possível ligar o lembrete neste celular. Tente de novo mais tarde.",
};

export default function Lembrete({ condominio }) {
  const [situacao, setSituacao] = useState(situacaoDoAparelho);
  const [ligado, setLigado] = useState(null); // null = conferindo
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [token, setToken] = useState(null); // comprovante do anti-robô
  const [chaveVerificacao, setChaveVerificacao] = useState(0);

  useEffect(() => {
    if (situacao !== "pronto") return;
    let ativo = true;
    lembreteLigado().then((v) => ativo && setLigado(v));
    return () => {
      ativo = false;
    };
  }, [situacao]);

  async function alternar() {
    setErro("");
    if (!ligado && VERIFICACAO_LIGADA && !token) {
      setErro("Aguarde a verificação de segurança terminar (alguns segundos) e toque de novo.");
      return;
    }
    setOcupado(true);
    const r = ligado ? await desligarLembrete() : await ligarLembrete(condominio.id, token);
    if (!ligado) {
      // O comprovante só vale uma vez: prepara outro para uma nova tentativa.
      setToken(null);
      setChaveVerificacao((k) => k + 1);
    }
    if (r.ok) setLigado(!ligado);
    else {
      setErro(ERROS[r.motivo] ?? ERROS.erro);
      if (r.motivo === "bloqueado") setSituacao("bloqueado");
    }
    setOcupado(false);
  }

  const hora = formatarHorario(condominio.horario);

  return (
    <section className="cartao cartao-lembrete" aria-labelledby="lembrete-titulo">
      <h2 id="lembrete-titulo">
        <IconeSino tamanho={20} /> Lembrete no celular
      </h2>

      {situacao === "em-breve" && (
        <p>
          Em breve: um aviso no seu celular às 6h30 do dia da coleta, para você não esquecer de colocar os recicláveis
          para fora.
        </p>
      )}

      {situacao === "desenvolvimento" && (
        <p className="dica">O lembrete só funciona no app publicado (ou em “npm.cmd run preview”).</p>
      )}

      {situacao === "iphone-instalar" && (
        <>
          <p>No iPhone, o lembrete só funciona com o app na tela inicial (iOS 16.4 ou mais novo):</p>
          <ol className="passos">
            <li>
              Abra esta página no <strong>Safari</strong>.
            </li>
            <li>
              Toque em <strong>Compartilhar</strong> <IconeCompartilhar tamanho={18} className="inline" />.
            </li>
            <li>
              Escolha <strong>Adicionar à Tela de Início</strong>.
            </li>
            <li>
              Abra o app <strong>Ecolimpo</strong> pela tela inicial e volte aqui.
            </li>
          </ol>
        </>
      )}

      {situacao === "sem-suporte" && (
        <p>
          Este navegador não recebe lembretes. No Android, use o Chrome. No iPhone, atualize para o iOS 16.4 ou mais novo e
          coloque o app na tela inicial.
        </p>
      )}

      {situacao === "bloqueado" && (
        <>
          <p>As notificações estão bloqueadas para este app. Para liberar:</p>
          <ul className="passos">
            <li>
              <strong>Android:</strong> toque no cadeado ao lado do endereço (ou segure o ícone do app) › Permissões ›
              Notificações › Permitir.
            </li>
            <li>
              <strong>iPhone:</strong> Ajustes › Notificações › Ecolimpo › Permitir Notificações.
            </li>
          </ul>
          <button type="button" className="botao botao-secundario botao-largo" onClick={() => setSituacao(situacaoDoAparelho())}>
            Já liberei
          </button>
        </>
      )}

      {situacao === "pronto" && (
        <>
          {ligado ? (
            <p className="lembrete-ligado">
              <IconeCheck tamanho={20} /> Lembrete ligado. Você recebe um aviso às 6h30 do dia da coleta (a coleta passa
              às {hora}) e os avisos da cooperativa para o seu condomínio.
            </p>
          ) : (
            <p>Receba um aviso às 6h30 do dia da coleta para não esquecer de colocar os recicláveis para fora, e os avisos da cooperativa para o seu condomínio.</p>
          )}
          {ligado === false && <VerificacaoHumana key={chaveVerificacao} aoVerificar={setToken} />}
          {erro && (
            <p className="erro erro-bloco" role="alert">
              {erro}
            </p>
          )}
          <button
            type="button"
            className={`botao botao-largo ${ligado ? "botao-secundario" : "botao-whatsapp"}`}
            onClick={alternar}
            disabled={ocupado || ligado === null}
            aria-pressed={Boolean(ligado)}
          >
            {ocupado ? "Aguarde…" : ligado === null ? "Conferindo…" : ligado ? "Desligar lembrete" : "Ligar lembrete"}
          </button>
          <p className="dica">Você pode desligar quando quiser. Não pedimos telefone nem e-mail.</p>
        </>
      )}
    </section>
  );
}
