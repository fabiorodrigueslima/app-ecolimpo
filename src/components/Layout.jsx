import { Link, NavLink } from "react-router-dom";
import { IconeInicio, IconeCalendario, IconeReciclar, IconeConversa } from "./Icones.jsx";

const ABAS = [
  { para: "/", rotulo: "Início", Icone: IconeInicio, fim: true },
  { para: "/coleta", rotulo: "Coleta", Icone: IconeCalendario },
  { para: "/recicla", rotulo: "Recicla?", Icone: IconeReciclar },
  { para: "/fale", rotulo: "Fale conosco", Icone: IconeConversa },
];

export default function Layout({ children, semMenu = false }) {
  return (
    <div className={`app ${semMenu ? "app-sem-menu" : ""}`}>
      <a className="pular" href="#conteudo">Pular para o conteúdo</a>
      <header className="topo">
        <Link to="/" className="topo-logo" aria-label="Ecolimpo — página inicial">
          <img src="/Nova-logo.png" alt="Cooperativa Ecolimpo" width="150" height="48" />
        </Link>
        <span className="topo-selo">Coleta Seletiva</span>
      </header>

      <main id="conteudo" className="conteudo">
        {children}
      </main>

      {!semMenu && (
        <nav className="abas" aria-label="Menu principal">
          {ABAS.map(({ para, rotulo, Icone, fim }) => (
            <NavLink key={para} to={para} end={fim} className="aba">
              <Icone tamanho={22} />
              <span>{rotulo}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
