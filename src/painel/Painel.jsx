import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BANCO_LIGADO } from "../lib/config.js";
import { lerRetornoDoEmail, lerAal, etapaDoMfa } from "./regras.js";
import { lerEmail, lerFatores, sair } from "./api.js";
import { apiPainel as api, definirSessao, obterToken, quandoExpirar, sessaoAtual } from "./sessao.js";
import DuasEtapas from "./DuasEtapas.jsx";
import Login from "./Login.jsx";
import NovaSenha from "./NovaSenha.jsx";
import Respostas from "./Respostas.jsx";
import Condominios from "./Condominios.jsx";
import Backup from "./Backup.jsx";
import "./painel.css";

// Lê o link do e-mail (nova senha / convite) uma vez, ao abrir.
function estadoInicial() {
  const retorno = lerRetornoDoEmail(window.location.hash);
  if (retorno?.sessao) {
    definirSessao(retorno.sessao, { guardar: false });
    return { etapa: "nova-senha", aviso: "" };
  }
  return { etapa: sessaoAtual() ? "conferir-mfa" : "login", aviso: retorno?.erro ?? "" };
}

export default function Painel() {
  const [{ etapa, aviso }, setEstado] = useState(estadoInicial);
  const [aba, setAba] = useState("respostas");
  const [mfa, setMfa] = useState(null); // { modo: "cadastrar" | "codigo", fatorId, token }
  const irPara = (proxima, novoAviso = "") => setEstado({ etapa: proxima, aviso: novoAviso });
  const sessao = sessaoAtual();

  useEffect(() => {
    quandoExpirar(() => setEstado({ etapa: "login", aviso: "Sua sessão terminou. Entre de novo." }));
    // Tira os códigos do link do e-mail da barra de endereço.
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Antes de tudo: o login já tem as 2 etapas? Se não, pede o código (ou o cadastro).
  useEffect(() => {
    if (etapa !== "conferir-mfa") return;
    let ativo = true;
    (async () => {
      const token = await obterToken();
      if (!ativo || !token) return; // sessão terminou: já voltou para o login
      if (lerAal(token) === "aal2") return setEstado((e) => ({ ...e, etapa: "verificando" }));
      const r = await lerFatores(token);
      if (!ativo) return;
      if (!r.ok) return setEstado((e) => ({ ...e, etapa: "sem-conexao" }));
      const fator = r.fatores.find((f) => f.factor_type === "totp" && f.status === "verified");
      setMfa({ modo: etapaDoMfa(r.fatores, "aal1"), fatorId: fator?.id ?? null, token });
      setEstado((e) => ({ ...e, etapa: "duas-etapas" }));
    })();
    return () => {
      ativo = false;
    };
  }, [etapa]);

  // Confere se o login faz parte da equipe.
  useEffect(() => {
    if (etapa !== "verificando") return;
    let ativo = true;
    api.ehEquipe().then((sim) => {
      if (!ativo || !sessaoAtual()) return; // sessão terminou: já voltou para o login
      const proxima = sim === true ? "dentro" : sim === false ? "sem-acesso" : "sem-conexao";
      setEstado((e) => ({ ...e, etapa: proxima }));
    });
    return () => {
      ativo = false;
    };
  }, [etapa]);

  async function fazerSair() {
    const token = sessaoAtual()?.token;
    definirSessao(null);
    irPara("login");
    if (token) await sair(token);
  }

  let corpo;
  if (!BANCO_LIGADO) {
    corpo = (
      <div className="painel-caixa">
        <h1>Painel ainda não configurado</h1>
        <p>Falta ligar o banco de dados (Supabase). Veja o arquivo .env.example.</p>
      </div>
    );
  } else if (etapa === "login") {
    corpo = (
      <Login
        aviso={aviso}
        aoEntrar={(s) => {
          definirSessao(s);
          irPara("conferir-mfa");
        }}
      />
    );
  } else if (etapa === "nova-senha") {
    corpo = (
      <NovaSenha
        sessao={sessao}
        aoTerminar={async () => {
          definirSessao({ ...sessao, email: await lerEmail(sessao.token) });
          irPara("conferir-mfa");
        }}
      />
    );
  } else if (etapa === "duas-etapas" && mfa) {
    corpo = (
      <DuasEtapas
        modo={mfa.modo}
        token={mfa.token}
        fatorId={mfa.fatorId}
        aoSair={fazerSair}
        aoConfirmar={(nova) => {
          definirSessao({ ...nova, email: nova.email || sessao?.email || "" });
          irPara("verificando");
        }}
      />
    );
  } else if (etapa === "conferir-mfa" || etapa === "verificando") {
    corpo = <p className="carregando">Conferindo acesso…</p>;
  } else if (etapa === "sem-conexao") {
    corpo = (
      <div className="painel-caixa">
        <h1>Sem conexão</h1>
        <p>Não foi possível falar com o banco de dados. Confira a internet.</p>
        <button type="button" className="botao botao-primario botao-largo" onClick={() => irPara("conferir-mfa")}>
          Tentar de novo
        </button>
      </div>
    );
  } else if (etapa === "sem-acesso") {
    corpo = (
      <div className="painel-caixa">
        <h1>Sem acesso ao painel</h1>
        <p>
          O login <strong>{sessao?.email}</strong> não está na lista da equipe. Peça para a coordenação incluir o seu
          e-mail.
        </p>
        <button type="button" className="botao botao-primario botao-largo" onClick={fazerSair}>
          Sair
        </button>
      </div>
    );
  } else {
    corpo = (
      <>
        <nav className="painel-abas" aria-label="Seções do painel">
          <button type="button" aria-pressed={aba === "respostas"} onClick={() => setAba("respostas")}>
            Respostas
          </button>
          <button type="button" aria-pressed={aba === "condominios"} onClick={() => setAba("condominios")}>
            Condomínios
          </button>
          <button type="button" aria-pressed={aba === "backup"} onClick={() => setAba("backup")}>
            Backup
          </button>
        </nav>
        {aba === "respostas" && <Respostas api={api} />}
        {aba === "condominios" && <Condominios api={api} />}
        {aba === "backup" && <Backup api={api} />}
      </>
    );
  }

  return (
    <div className="painel">
      <header className="painel-topo">
        <Link to="/painel" className="painel-logo" aria-label="Painel da Ecolimpo">
          <img src="/Nova-logo.png" alt="Cooperativa Ecolimpo" width="120" height="40" />
        </Link>
        <span className="painel-titulo">Painel da cooperativa</span>
        {etapa === "dentro" && (
          <span className="painel-usuario">
            <span className="painel-email">{sessao?.email}</span>
            <button type="button" className="link-botao" onClick={fazerSair}>
              Sair
            </button>
          </span>
        )}
      </header>
      <main className="painel-conteudo">{corpo}</main>
    </div>
  );
}
