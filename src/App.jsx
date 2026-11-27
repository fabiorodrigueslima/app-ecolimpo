import { lazy, Suspense, useEffect, useRef } from "react";
import { contarAbertura, ouvirInstalacao } from "./lib/contagem.js";
import { Routes, Route, useLocation } from "react-router-dom";
import { atualizarCondominioDoLembrete } from "./lib/lembrete.js";
import { CondominioContexto, useCondominioMorador } from "./lib/condominios.js";
import Layout from "./components/Layout.jsx";
import EscolherCondominio from "./pages/EscolherCondominio.jsx";
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Contadores de uso (só números, sem dados pessoais): 1 abertura por visita,
  // a instalação e a entrada pelo QR Code. Painel e cartaz não contam.
  const ehDaEquipe = pathname === "/painel" || pathname.startsWith("/painel/") || pathname === "/cartaz";
  const jaContou = useRef(false);
  const localAtual = useRef(null);
  useEffect(() => {
    localAtual.current = condominio;
  }, [condominio]);
  useEffect(() => {
    if (jaContou.current || carregando || ehDaEquipe) return;
    jaContou.current = true;
    contarAbertura({ local: condominio, veioDoQr: new URLSearchParams(search).get("c") ?? "" });
  }, [carregando, ehDaEquipe, condominio, search]);
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
    atualizarCondominioDoLembrete(novo.id);
  }

  let conteudo;
  if (carregando && !condominio) {
    conteudo = (
      <Layout semMenu>
        <Aguarde />
      </Layout>
    );
  } else if (!condominio && pathname !== "/privacidade") {
    // Primeira vez (ou o condomínio saiu do app): escolher antes de tudo.
    conteudo = (
      <Layout semMenu>
        <EscolherCondominio aoEscolher={escolher} primeiraVez idDoLink={new URLSearchParams(search).get("c")} />
      </Layout>
    );
  } else {
    conteudo = (
      <Layout semMenu={!condominio}>
        <Routes>
          <Route path="/" element={<Inicio condominio={condominio} />} />
          <Route path="/condominio" element={<EscolherCondominio atual={condominio} aoEscolher={escolher} />} />
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
