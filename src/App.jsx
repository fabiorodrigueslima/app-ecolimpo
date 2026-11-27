import { lazy, Suspense, useEffect, useRef } from "react";
import { contarAbertura, ouvirInstalacao } from "./lib/contagem.js";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { atualizarCondominioDoLembrete, desligarLembrete } from "./lib/lembrete.js";
import { useMoradia, localDaCasa, nomeDaCasa } from "./lib/moradia.js";
import { CondominioContexto, useCondominioMorador } from "./lib/condominios.js";
import Layout from "./components/Layout.jsx";
import EscolherMoradia from "./pages/EscolherMoradia.jsx";
import { InicioCasa, ColetaDaCasa } from "./pages/Casa.jsx";
import Inicio from "./pages/Inicio.jsx";
import Coleta from "./pages/Coleta.jsx";
import Recicla from "./pages/Recicla.jsx";
import Fale from "./pages/Fale.jsx";
import Pesquisa from "./pages/Pesquisa.jsx";
import Mensagem from "./pages/Mensagem.jsx";
import Privacidade from "./pages/Privacidade.jsx";
import NaoEncontrada from "./pages/NaoEncontrada.jsx";

// O painel e o cartaz só são baixados por quem abre esses endereços (os moradores não baixam).
const Painel = lazy(() => import("./painel/Painel.jsx"));
const Cartaz = lazy(() => import("./cartaz/Cartaz.jsx"));

function Aguarde({ texto = "Carregando…" }) {
  return (
    <p className="carregando" role="status">
      {texto}
    </p>
  );
}

export default function App() {
  const { pathname, search } = useLocation();
  const { condominio, carregando, escolher: guardarEscolha } = useCondominioMorador();
  const { moradia, casa, escolherCasa, escolherCondominio } = useMoradia();
  const idDoLink = new URLSearchParams(search).get("c");
  // Mora em casa / rua? (o QR Code de um condomínio leva para a escolha do condomínio)
  const modoCasa = moradia?.tipo === "casa" && !idDoLink;
  const localDoMorador = modoCasa ? localDaCasa(casa) : condominio;
  const esperando = modoCasa ? false : carregando;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Contadores de uso (só números, sem dados pessoais): 1 abertura por visita,
  // a instalação e a entrada pelo QR Code. Painel e cartaz não contam.
  const ehDaEquipe = pathname === "/painel" || pathname.startsWith("/painel/") || pathname === "/cartaz";
  const jaContou = useRef(false);
  const localAtual = useRef(null);
  useEffect(() => {
    localAtual.current = localDoMorador;
  }, [localDoMorador]);
  useEffect(() => {
    if (jaContou.current || esperando || ehDaEquipe) return;
    jaContou.current = true;
    contarAbertura({ local: localDoMorador, veioDoQr: idDoLink ?? "" });
  }, [esperando, ehDaEquipe, localDoMorador, idDoLink]);
  useEffect(() => ouvirInstalacao(() => localAtual.current), []);

  if (pathname === "/painel" || pathname.startsWith("/painel/")) {
    return (
      <Suspense fallback={<Aguarde />}>
        <Painel />
      </Suspense>
    );
  }

  // Cartaz: só para a equipe (a página confere o login do painel).
  if (pathname === "/cartaz") {
    return (
      <Suspense fallback={<Aguarde />}>
        <Cartaz />
      </Suspense>
    );
  }

  function escolher(novo) {
    guardarEscolha(novo);
    escolherCondominio();
    atualizarCondominioDoLembrete(novo.id);
  }

  // Mudou para casa / rua: o lembrete é só dos condomínios, então é desligado
  // (senão continuaria chegando o aviso do condomínio antigo).
  function escolherMinhaCasa(areaId) {
    escolherCasa(areaId);
    if (condominio) desligarLembrete();
  }

  const telaDeEscolha = (primeiraVez) => (
    <EscolherMoradia
      primeiraVez={primeiraVez}
      idDoLink={primeiraVez ? idDoLink : null}
      condominioAtual={modoCasa ? null : condominio}
      nomeAtual={modoCasa ? nomeDaCasa(casa) : condominio?.nome}
      aoEscolherCondominio={escolher}
      aoEscolherCasa={escolherMinhaCasa}
    />
  );

  let conteudo;
  if (modoCasa && casa) {
    // Casa / rua: só informativo (circuitos do SLU).
    conteudo = (
      <Layout>
        <Routes>
          <Route path="/" element={<InicioCasa casa={casa} />} />
          <Route path="/condominio" element={telaDeEscolha(false)} />
          <Route path="/coleta" element={<ColetaDaCasa casa={casa} />} />
          <Route path="/recicla" element={<Recicla casa={casa} />} />
          <Route path="/fale" element={<Fale casa={casa} />} />
          <Route path="/fale/*" element={<Navigate to="/fale" replace />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </Layout>
    );
  } else if (modoCasa && pathname !== "/privacidade") {
    // A área escolhida saiu da lista (o SLU mudou): escolher de novo.
    conteudo = <Layout semMenu>{telaDeEscolha(true)}</Layout>;
  } else if (moradia?.tipo === "casa" && idDoLink) {
    // Mora em casa, mas abriu o QR Code de um condomínio: confirma o condomínio.
    conteudo = <Layout semMenu>{telaDeEscolha(true)}</Layout>;
  } else if (esperando && !condominio) {
    conteudo = (
      <Layout semMenu>
        <Aguarde />
      </Layout>
    );
  } else if (!condominio && pathname !== "/privacidade") {
    // Primeira vez (ou o condomínio saiu do app): "Onde você mora?" antes de tudo.
    conteudo = <Layout semMenu>{telaDeEscolha(true)}</Layout>;
  } else {
    conteudo = (
      <Layout semMenu={!condominio}>
        <Routes>
          <Route path="/" element={<Inicio condominio={condominio} />} />
          <Route path="/condominio" element={telaDeEscolha(false)} />
          <Route path="/coleta" element={<Coleta condominio={condominio} />} />
          <Route path="/recicla" element={<Recicla condominio={condominio} />} />
          <Route path="/fale" element={<Fale condominio={condominio} />} />
          <Route path="/fale/pesquisa" element={<Pesquisa condominio={condominio} />} />
          <Route path="/fale/mensagem" element={<Mensagem condominio={condominio} />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </Layout>
    );
  }

  return <CondominioContexto.Provider value={condominio}>{conteudo}</CondominioContexto.Provider>;
}
