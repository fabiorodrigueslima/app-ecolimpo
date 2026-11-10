import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { lerCondominioSalvo, salvarCondominio } from "./lib/armazenamento.js";
import { atualizarCondominioDoLembrete } from "./lib/lembrete.js";
import { CondominiosContexto, useCarregarCondominios } from "./lib/condominios.js";
import { lerCondominioDoLink } from "./lib/link.js";
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
  const condominios = useCarregarCondominios();
  const [idSalvo, setIdSalvo] = useState(lerCondominioSalvo);
  const condominio = condominios.lista.find((c) => c.id === idSalvo) ?? null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (pathname === "/painel" || pathname.startsWith("/painel/")) {
    return (
      <Suspense fallback={<Aguarde />}>
        <Painel />
      </Suspense>
    );
  }

  if (pathname === "/cartaz") {
    return (
      <CondominiosContexto.Provider value={condominios.lista}>
        <Suspense fallback={<Aguarde />}>
          <Cartaz />
        </Suspense>
      </CondominiosContexto.Provider>
    );
  }

  function escolher(id) {
    salvarCondominio(id);
    setIdSalvo(id);
    atualizarCondominioDoLembrete(id);
  }

  let conteudo;
  if (condominios.carregando && condominios.lista.length === 0) {
    conteudo = (
      <Layout semMenu>
        <Aguarde />
      </Layout>
    );
  } else if (condominios.erro) {
    conteudo = (
      <Layout semMenu>
        <div className="pagina obrigado">
          <h1>Sem conexão</h1>
          <p>Não foi possível carregar a lista de condomínios. Confira a internet.</p>
          <button type="button" className="botao botao-primario botao-largo" onClick={condominios.tentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      </Layout>
    );
  } else if (!condominio && pathname !== "/privacidade") {
    // Primeira vez (ou condomínio saiu da lista): escolher antes de tudo.
    conteudo = (
      <Layout semMenu>
        <EscolherCondominio
          aoEscolher={escolher}
          primeiraVez
          sugerido={lerCondominioDoLink(search, condominios.lista.map((c) => c.id))}
        />
      </Layout>
    );
  } else {
    conteudo = (
      <Layout semMenu={!condominio}>
        <Routes>
          <Route path="/" element={<Inicio condominio={condominio} />} />
          <Route path="/condominio" element={<EscolherCondominio atual={condominio} aoEscolher={escolher} />} />
          <Route path="/coleta" element={<Coleta condominio={condominio} />} />
          <Route path="/recicla" element={<Recicla />} />
          <Route path="/fale" element={<Fale />} />
          <Route path="/fale/pesquisa" element={<Pesquisa condominio={condominio} />} />
          <Route path="/fale/mensagem" element={<Mensagem condominio={condominio} />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </Layout>
    );
  }

  return <CondominiosContexto.Provider value={condominios.lista}>{conteudo}</CondominiosContexto.Provider>;
}
