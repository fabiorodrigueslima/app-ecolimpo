import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCondominios } from "../lib/condominios.js";
import { linkWhatsapp } from "../data/contatos.js";
import { normalizar } from "../lib/busca.js";
import { AvisoPreencher, Cabecalho } from "../components/Comuns.jsx";
import { IconeBusca } from "../components/Icones.jsx";

export default function EscolherCondominio({ atual, aoEscolher, primeiraVez = false }) {
  const condominios = useCondominios();
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState(atual?.id ?? "");
  const navegar = useNavigate();

  const lista = useMemo(() => {
    const termo = normalizar(busca);
    return [...condominios]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .filter((c) => !termo || normalizar(`${c.nome} ${c.regiao ?? ""}`).includes(termo));
  }, [busca, condominios]);

  const temExemplo = condominios.some((c) => c.exemplo);

  function confirmar(e) {
    e.preventDefault();
    if (!escolhido) return;
    aoEscolher(escolhido);
    navegar("/");
  }

  return (
    <form onSubmit={confirmar} className="pagina">
      {primeiraVez ? (
        <div className="boas-vindas">
          <p className="sobretitulo">Bem-vindo(a)!</p>
          <h1>Qual é o seu condomínio?</h1>
          <p>Escolha uma vez e o app mostra o dia da sua coleta seletiva. A escolha fica salva só neste celular.</p>
        </div>
      ) : (
        <Cabecalho titulo="Trocar condomínio" voltar="/" />
      )}

      {temExemplo && <AvisoPreencher>A lista abaixo ainda é de exemplo.</AvisoPreencher>}

      {condominios.length > 6 && (
        <label className="campo-busca">
          <IconeBusca tamanho={20} />
          <span className="sr">Buscar condomínio</span>
          <input
            type="search"
            placeholder="Buscar pelo nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      )}

      <fieldset className="lista-opcoes">
        <legend className="sr">Condomínios atendidos</legend>
        {lista.map((c) => (
          <label key={c.id} className={`opcao ${escolhido === c.id ? "opcao-marcada" : ""}`}>
            <input
              type="radio"
              name="condominio"
              value={c.id}
              checked={escolhido === c.id}
              onChange={() => setEscolhido(c.id)}
            />
            <span className="opcao-texto">
              <strong>{c.nome}</strong>
              {c.regiao && <small>{c.regiao}</small>}
            </span>
          </label>
        ))}
        {lista.length === 0 && (
          <p className="vazio">
            {condominios.length === 0 ? "Nenhum condomínio cadastrado ainda." : "Nenhum condomínio encontrado."}
          </p>
        )}
      </fieldset>

      <div className="rodape-fixo">
        <button type="submit" className="botao botao-primario botao-largo" disabled={!escolhido}>
          Confirmar
        </button>
      </div>

      <p className="nota-centro">
        Não encontrou o seu condomínio?{" "}
        <a href={linkWhatsapp("Olá! Meu condomínio não aparece no app da Ecolimpo.")} target="_blank" rel="noreferrer">
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
