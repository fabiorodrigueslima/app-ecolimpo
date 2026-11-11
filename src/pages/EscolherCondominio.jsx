import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buscarCondominios, condominioPorId, termoValido, MINIMO_LETRAS } from "../lib/condominios.js";
import { linkWhatsapp } from "../data/contatos.js";
import { AvisoPreencher, Cabecalho } from "../components/Comuns.jsx";
import { IconeBusca, IconePredio } from "../components/Icones.jsx";

// O morador digita parte do nome e vê SÓ os condomínios que combinam (no máximo 3).
// Pelo QR Code do cartaz, o condomínio já vem marcado.
export default function EscolherCondominio({ atual, aoEscolher, primeiraVez = false, idDoLink = null }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [situacao, setSituacao] = useState("digitando"); // digitando | buscando | pronto | erro
  const [marcado, setMarcado] = useState(null);
  const [veioDoQr, setVeioDoQr] = useState(false);
  const navegar = useNavigate();

  // Veio pelo QR Code: busca o condomínio do cartaz.
  useEffect(() => {
    if (!idDoLink) return;
    let ativo = true;
    condominioPorId(idDoLink).then((r) => {
      if (!ativo || !r.condominio) return;
      setResultados([r.condominio]);
      setMarcado(r.condominio);
      setVeioDoQr(true);
      setSituacao("pronto");
    });
    return () => {
      ativo = false;
    };
  }, [idDoLink]);

  // Busca enquanto digita (espera o morador parar de digitar um pouquinho).
  useEffect(() => {
    if (!termoValido(texto)) return;
    let ativo = true;
    const relogio = setTimeout(() => {
      setSituacao("buscando");
      buscarCondominios(texto).then((r) => {
        if (!ativo) return;
        setResultados(r.lista);
        setSituacao(r.ok ? "pronto" : "erro");
      });
    }, 400);
    return () => {
      ativo = false;
      clearTimeout(relogio);
    };
  }, [texto]);

  function mudarTexto(valor) {
    setTexto(valor);
    setVeioDoQr(false);
    if (!termoValido(valor)) {
      setResultados([]);
      setMarcado(null);
      setSituacao("digitando");
    }
  }

  function confirmar(e) {
    e.preventDefault();
    if (!marcado) return;
    aoEscolher(marcado);
    navegar("/");
  }

  const temExemplo = resultados.some((c) => c.exemplo);

  return (
    <form onSubmit={confirmar} className="pagina">
      {primeiraVez ? (
        <div className="boas-vindas">
          <p className="sobretitulo">Bem-vindo(a)!</p>
          <h1>Qual é o seu condomínio?</h1>
          <p>
            {veioDoQr
              ? "Seu condomínio já está marcado. Confira e toque em Confirmar."
              : "Digite o nome do seu condomínio. O app mostra o dia da sua coleta seletiva."}{" "}
            A escolha fica salva só neste celular.
          </p>
        </div>
      ) : (
        <Cabecalho titulo="Trocar condomínio" voltar="/" />
      )}

      {atual && (
        <div className="condominio-atual">
          <IconePredio tamanho={22} />
          <div>
            <small>Condomínio atual</small>
            <strong>{atual.nome}</strong>
          </div>
        </div>
      )}

      <label className="campo-busca">
        <IconeBusca tamanho={20} />
        <span className="sr">Nome do seu condomínio</span>
        <input
          type="search"
          placeholder="Nome do seu condomínio"
          value={texto}
          onChange={(e) => mudarTexto(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <p className="dica">
        Digite pelo menos {MINIMO_LETRAS} letras do nome. Ex.: <strong>Mirante</strong>. Se você tem o cartaz da coleta,
        é só apontar a câmera para o QR Code.
      </p>

      {temExemplo && <AvisoPreencher>Modo de teste: condomínios de exemplo.</AvisoPreencher>}

      <div aria-live="polite">
        {situacao === "buscando" && <p className="vazio">Procurando…</p>}
        {situacao === "erro" && (
          <p className="erro erro-bloco" role="alert">
            Não foi possível procurar agora. Confira a internet e tente de novo.
          </p>
        )}
        {situacao === "pronto" && resultados.length === 0 && (
          <p className="vazio">Nenhum condomínio encontrado com esse nome. Confira se escreveu certo.</p>
        )}
      </div>

      {resultados.length > 0 && (
        <fieldset className="lista-opcoes">
          <legend className="sr">Condomínios encontrados</legend>
          {resultados.map((c) => (
            <label key={c.id} className={`opcao ${marcado?.id === c.id ? "opcao-marcada" : ""}`}>
              <input
                type="radio"
                name="condominio"
                value={c.id}
                checked={marcado?.id === c.id}
                onChange={() => setMarcado(c)}
              />
              <span className="opcao-texto">
                <strong>{c.nome}</strong>
                {c.regiao && <small>{c.regiao}</small>}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="rodape-fixo">
        <button type="submit" className="botao botao-primario botao-largo" disabled={!marcado}>
          Confirmar
        </button>
      </div>

      <p className="nota-centro">
        Não encontrou o seu condomínio?{" "}
        <a href={linkWhatsapp("Olá! Não encontrei meu condomínio no app da Ecolimpo.")} target="_blank" rel="noreferrer">
          Fale com a cooperativa
        </a>
        .
      </p>
      <p className="nota-centro">
        <Link to="/privacidade">Política de privacidade</Link>
      </p>
    </form>
  );
}
