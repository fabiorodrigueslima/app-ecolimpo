import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { condominios } from "./data/condominios.js";
import { lerCondominioSalvo, salvarCondominio } from "./lib/armazenamento.js";
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

function encontrar(id) {
  return condominios.find((c) => c.id === id) ?? null;
}

export default function App() {
  const [condominio, setCondominio] = useState(() => encontrar(lerCondominioSalvo()));
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  function escolher(id) {
    salvarCondominio(id);
    setCondominio(encontrar(id));
  }

  // Primeira vez: o morador escolhe o condomínio antes de tudo
  // (a política de privacidade continua acessível).
  if (!condominio && pathname !== "/privacidade") {
    return (
      <Layout semMenu>
        <EscolherCondominio aoEscolher={escolher} primeiraVez />
      </Layout>
    );
  }

  return (
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
