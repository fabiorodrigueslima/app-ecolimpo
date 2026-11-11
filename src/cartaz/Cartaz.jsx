import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { normalizarCondominio } from "../lib/condominios.js";
import { BANCO_LIGADO } from "../lib/config.js";
import { condominios as doArquivo } from "../data/condominios.js";
import { apiPainel, sessaoAtual } from "../painel/sessao.js";
import { descreverDias, formatarHorario, periodoDoHorario } from "../lib/coleta.js";
import { linkDoCondominio, lerCondominioDoLink, enderecoCurto, URL_APP } from "../lib/link.js";
import { svgDoQr } from "../lib/qr.js";
import { contatos } from "../data/contatos.js";
import { IconeCalendario, IconeSino, IconeReciclar, IconeConversa } from "../components/Icones.jsx";
import "./cartaz.css";

function QrCode({ texto }) {
  const { total, caminho } = useMemo(() => svgDoQr(texto), [texto]);
  return (
    <svg className="cartaz-qr" viewBox={`0 0 ${total} ${total}`} role="img" aria-label={`QR Code: ${texto}`} shapeRendering="crispEdges">
      <rect width={total} height={total} fill="#fff" />
      <path d={caminho} fill="#000" />
    </svg>
  );
}

const VANTAGENS = [
  { Icone: IconeCalendario, texto: "Veja o dia e o horário da coleta" },
  { Icone: IconeSino, texto: "Receba um lembrete às 6h30 no dia da coleta" },
  { Icone: IconeReciclar, texto: "Descubra o que pode ser reciclado" },
  { Icone: IconeConversa, texto: "Avalie e fale com a cooperativa" },
];

// A lista de condomínios é privada: o cartaz só abre para quem está logado no painel.
function useCondominiosDaEquipe() {
  const [estado, setEstado] = useState(() => {
    if (!BANCO_LIGADO) return { lista: doArquivo.map(normalizarCondominio), situacao: "pronto" };
    if (!sessaoAtual()) return { lista: [], situacao: "sem-acesso" };
    return { lista: [], situacao: "carregando" };
  });

  useEffect(() => {
    if (estado.situacao !== "carregando") return;
    let ativo = true;
    apiPainel.listarCondominios().then((r) => {
      if (!ativo) return;
      if (r.ok) setEstado({ lista: r.dados.filter((c) => c.ativo).map(normalizarCondominio), situacao: "pronto" });
      else setEstado({ lista: [], situacao: r.status === 401 || r.status === 403 ? "sem-acesso" : "erro" });
    });
    return () => {
      ativo = false;
    };
  }, [estado.situacao]);

  return estado;
}

export default function Cartaz() {
  const { lista, situacao } = useCondominiosDaEquipe();
  if (situacao === "pronto") return <CartazConteudo condominios={lista} />;
  return (
    <div className="cartaz-pagina">
      <div className="cartaz-ferramentas">
        <h1>Cartaz com QR Code</h1>
        {situacao === "carregando" && <p className="carregando">Carregando…</p>}
        {situacao === "sem-acesso" && (
          <>
            <p>O cartaz é só para a equipe da cooperativa. Entre no painel e abra o cartaz pela aba Condomínios.</p>
            <Link to="/painel" className="botao botao-primario botao-largo">
              Entrar no painel
            </Link>
          </>
        )}
        {situacao === "erro" && (
          <p className="erro erro-bloco" role="alert">
            Não foi possível carregar os condomínios. Confira a internet e recarregue a página.
          </p>
        )}
      </div>
    </div>
  );
}

function CartazConteudo({ condominios }) {
  const { search } = useLocation();
  const ordenados = useMemo(
    () => [...condominios].sort((a, b) => Number(b.piloto) - Number(a.piloto) || a.nome.localeCompare(b.nome, "pt-BR")),
    [condominios],
  );
  const [escolhido, setEscolhido] = useState(null); // null = usa o do endereço (?c=)
  const id = escolhido ?? lerCondominioDoLink(search, condominios.map((c) => c.id)) ?? "";
  const condominio = condominios.find((c) => c.id === id) ?? null;
  const link = condominio ? linkDoCondominio(condominio.id) : `${URL_APP}/`;

  return (
    <div className="cartaz-pagina">
      <div className="cartaz-ferramentas">
        <Link to="/" className="link-pequeno">
          ← Voltar ao app
        </Link>
        <h1>Cartaz com QR Code</h1>
        <label className="campo">
          <span>Condomínio do cartaz</span>
          <select value={id} onChange={(e) => setEscolhido(e.target.value)}>
            <option value="">Cartaz geral (sem condomínio)</option>
            {ordenados.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.piloto ? " — piloto" : ""}
              </option>
            ))}
          </select>
        </label>
        {condominio?.exemplo && (
          <p className="aviso-preencher" role="note">
            <strong>A PREENCHER</strong> Este condomínio é de exemplo. Não imprima.
          </p>
        )}
        <p className="aviso-preencher" role="note">
          <strong>Antes de imprimir vários:</strong> imprima um, aponte a câmera do celular para o QR Code e confira se
          abre <strong>{enderecoCurto()}</strong> com o condomínio certo já marcado.
        </p>
        <button type="button" className="botao botao-primario botao-largo" onClick={() => window.print()}>
          Imprimir (folha A4)
        </button>
      </div>

      <article className="cartaz-folha" aria-label="Prévia do cartaz">
        <header className="cartaz-topo">
          <img src="/Nova-logo.png" alt="Cooperativa Ecolimpo" width="240" height="80" />
          <span className="cartaz-selo">Coleta seletiva</span>
        </header>

        <h2 className="cartaz-titulo">A coleta seletiva agora está no seu celular</h2>

        {condominio && (
          <section className="cartaz-coleta">
            <p className="cartaz-condominio">{condominio.nome}</p>
            <p className="cartaz-dia">Toda {descreverDias(condominio.dias)}</p>
            <p className="cartaz-hora">
              A coleta passa às <strong>{formatarHorario(condominio.horario)}</strong> ({periodoDoHorario(condominio.horario)})
            </p>
            <p className="cartaz-dica">Coloque os recicláveis para fora antes desse horário.</p>
          </section>
        )}

        <section className="cartaz-meio">
          <div className="cartaz-qr-caixa">
            <QrCode texto={link} />
            <p className="cartaz-qr-instrucao">Aponte a câmera do celular</p>
            <p className="cartaz-endereco">{enderecoCurto()}</p>
          </div>
          <ul className="cartaz-vantagens">
            {VANTAGENS.map(({ Icone, texto }) => (
              <li key={texto}>
                <span className="cartaz-icone">
                  <Icone tamanho={30} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </section>

        <p className="cartaz-gratis">
          Gratuito. Não precisa baixar na loja nem fazer cadastro. Não pedimos CPF nem telefone.
        </p>
        <p className="cartaz-iphone">
          <strong>iPhone:</strong> abra no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início” para receber o
          lembrete.
        </p>

        <footer className="cartaz-rodape">
          <span>WhatsApp {contatos.telefone}</span>
          <span>{contatos.instagramNome}</span>
          <span>{contatos.nomeOficial}</span>
        </footer>
      </article>
    </div>
  );
}
