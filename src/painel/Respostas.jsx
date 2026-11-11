import { useEffect, useMemo, useState } from "react";
import { TEMAS_PESQUISA, TIPOS_MENSAGEM } from "../lib/formularios.js";
import { ROTULO_TIPO, formatarDataHora, paraCsv, resumoNotas, rotuloMotivo, rotuloHabito } from "./regras.js";
import { HABITOS } from "../data/pesquisa.js";

const POR_PAGINA = 50;

const pct = (v) => (v === null ? "—" : `${v}%`);

// Quadro de resultados da pesquisa (conforme os filtros escolhidos).
function ResumoPesquisa({ resumo }) {
  const { temas, nps, motivos, habito } = resumo;
  return (
    <div className="resumo-pesquisa" aria-label="Resultados da pesquisa">
      <div className="resumo">
        <div className="resumo-item">
          <strong>{resumo.total}</strong>
          <span>respostas no período</span>
          <small>{resumo.pesquisas} pesquisas de satisfação</small>
        </div>
        {TEMAS_PESQUISA.map((t) => (
          <div key={t.id} className="resumo-item">
            <strong>{pct(temas[t.id].satisfeitos)}</strong>
            <span>satisfeitos com {t.rotulo.toLowerCase()}</span>
            <small>
              {temas[t.id].respostas} respostas
              {resumo.medias[t.id] !== null && ` · média ${resumo.medias[t.id].toLocaleString("pt-BR")} de 5`}
            </small>
          </div>
        ))}
        <div className="resumo-item resumo-nps">
          <strong>{nps.valor === null ? "—" : nps.valor > 0 ? `+${nps.valor}` : nps.valor}</strong>
          <span>NPS (recomendação)</span>
          <small>
            {nps.respostas
              ? `${pct(nps.promotores)} recomendam · ${pct(nps.detratores)} não recomendam`
              : "sem respostas"}
          </small>
        </div>
      </div>

      {(habito.respostas > 0 || motivos.length > 0) && (
        <div className="resumo-detalhes">
          {habito.respostas > 0 && (
            <div className="resumo-bloco">
              <h2>Separa os recicláveis em casa?</h2>
              <ul className="barras">
                {HABITOS.map((h) => (
                  <li key={h.id} className="barra">
                    <span className="barra-nome">{h.rotulo}</span>
                    <span className="barra-trilho" aria-hidden="true">
                      <span className="barra-valor" style={{ width: `${habito[h.id] ?? 0}%` }} />
                    </span>
                    <span className="barra-numero">{pct(habito[h.id])}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {motivos.length > 0 && (
            <div className="resumo-bloco">
              <h2>Motivos das notas baixas</h2>
              <ol className="ranking">
                {motivos.slice(0, 6).map((m) => (
                  <li key={m.codigo}>
                    <span>{m.rotulo}</span>
                    <strong>{m.total}</strong>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
      <p className="dica">
        Satisfeitos = notas 4 e 5 (“Não sei” não entra na conta). NPS vai de −100 a +100: % que dá 9 ou 10 menos % que
        dá 0 a 6.
      </p>
    </div>
  );
}
const MAXIMO_PLANILHA = 10000;
const FILTROS_INICIAIS = { tipo: "todas", condominio: "", periodo: "30", soNaoLidas: false };

export default function Respostas({ api }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [nomes, setNomes] = useState({});
  const [lista, setLista] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [estado, setEstado] = useState("carregando"); // carregando | pronto | erro
  const [temMais, setTemMais] = useState(false);
  const [aviso, setAviso] = useState("");

  // Nomes dos condomínios (para o filtro e para mostrar nas respostas).
  useEffect(() => {
    let ativo = true;
    api.listarCondominios().then((r) => {
      if (ativo && r.ok) setNomes(Object.fromEntries(r.dados.map((c) => [c.id, c.nome])));
    });
    return () => {
      ativo = false;
    };
  }, [api]);

  // Recarrega quando o filtro muda.
  useEffect(() => {
    let ativo = true;
    Promise.all([
      api.listarRespostas(filtros, { limite: POR_PAGINA }),
      api.listarRespostas(filtros, {
        limite: MAXIMO_PLANILHA,
        campos: "tipo,nota_coleta,nota_mobilizacao,nota_atendimento,nps,habito,motivos",
      }),
    ]).then(([pagina, todas]) => {
      if (!ativo) return;
      if (!pagina.ok || !todas.ok) {
        setEstado("erro");
        return;
      }
      setLista(pagina.dados);
      setTemMais(pagina.dados.length === POR_PAGINA);
      setResumo(resumoNotas(todas.dados));
      setEstado("pronto");
    });
    return () => {
      ativo = false;
    };
  }, [api, filtros]);

  function mudarFiltro(campo, valor) {
    setEstado("carregando");
    setAviso("");
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  async function carregarMais() {
    const r = await api.listarRespostas(filtros, { limite: POR_PAGINA, deslocamento: lista.length });
    if (!r.ok) return setAviso("Não foi possível carregar mais. Tente de novo.");
    setLista((l) => [...l, ...r.dados]);
    setTemMais(r.dados.length === POR_PAGINA);
  }

  async function alternarLida(resposta) {
    const r = await api.marcarLida(resposta.id, !resposta.lida);
    if (!r.ok) return setAviso("Não foi possível salvar. Tente de novo.");
    setLista((l) => l.map((x) => (x.id === resposta.id ? { ...x, lida: !x.lida } : x)));
  }

  async function apagar(resposta) {
    const ok = window.confirm("Apagar esta resposta para sempre? Use só se o morador pediu. Não dá para desfazer.");
    if (!ok) return;
    const r = await api.apagarResposta(resposta.id);
    if (!r.ok) return setAviso("Não foi possível apagar. Tente de novo.");
    setLista((l) => l.filter((x) => x.id !== resposta.id));
    setAviso("Resposta apagada.");
  }

  async function baixarPlanilha() {
    const r = await api.listarRespostas(filtros, { limite: MAXIMO_PLANILHA });
    if (!r.ok) return setAviso("Não foi possível gerar a planilha. Tente de novo.");
    const arquivo = new Blob([paraCsv(r.dados, nomes)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = `respostas-ecolimpo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  const condominiosOrdenados = useMemo(
    () => Object.entries(nomes).sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    [nomes],
  );

  return (
    <section className="painel-secao" aria-labelledby="respostas-titulo">
      <h1 id="respostas-titulo">Respostas dos moradores</h1>

      <div className="filtros">
        <label className="campo">
          <span>Tipo</span>
          <select value={filtros.tipo} onChange={(e) => mudarFiltro("tipo", e.target.value)}>
            <option value="todas">Todas</option>
            <option value="pesquisa">Pesquisas de satisfação</option>
            <option value="mensagens">Todas as mensagens</option>
            {TIPOS_MENSAGEM.map((t) => (
              <option key={t.id} value={t.id}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Condomínio</span>
          <select value={filtros.condominio} onChange={(e) => mudarFiltro("condominio", e.target.value)}>
            <option value="">Todos</option>
            {condominiosOrdenados.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Período</span>
          <select value={filtros.periodo} onChange={(e) => mudarFiltro("periodo", e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="365">Último ano</option>
            <option value="tudo">Tudo</option>
          </select>
        </label>
        <label className="marcar">
          <input type="checkbox" checked={filtros.soNaoLidas} onChange={(e) => mudarFiltro("soNaoLidas", e.target.checked)} />
          Só as não lidas
        </label>
      </div>

      {estado === "carregando" && <p className="carregando">Carregando…</p>}
      {estado === "erro" && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível carregar as respostas. Confira a internet e mude o filtro para tentar de novo.
        </p>
      )}

      {estado === "pronto" && resumo && <ResumoPesquisa resumo={resumo} />}

      {aviso && (
        <p className="aviso-ok" role="status">
          {aviso}
        </p>
      )}

      {estado === "pronto" && (
        <>
          <div className="acoes-lista">
            <button type="button" className="botao botao-secundario" onClick={baixarPlanilha} disabled={!lista.length}>
              Baixar planilha (CSV)
            </button>
          </div>

          {lista.length === 0 && <p className="vazio">Nenhuma resposta com estes filtros.</p>}

          <ul className="respostas">
            {lista.map((r) => (
              <li key={r.id} className={`resposta ${r.lida ? "resposta-lida" : ""}`}>
                <div className="resposta-topo">
                  <span className={`etiqueta etiqueta-${r.tipo}`}>{ROTULO_TIPO[r.tipo] ?? r.tipo}</span>
                  <span className="resposta-data">{formatarDataHora(r.criado_em)}</span>
                </div>
                <p className="resposta-condominio">{nomes[r.condominio_id] ?? r.condominio_id}</p>
                {r.tipo === "pesquisa" && (
                  <>
                    <ul className="resposta-notas">
                      {TEMAS_PESQUISA.map((t) => (
                        <li key={t.id}>
                          {t.rotulo}: <strong>{r[`nota_${t.id}`] ?? "não sei"}</strong>
                        </li>
                      ))}
                      {r.nps != null && (
                        <li>
                          Recomendação: <strong>{r.nps}/10</strong>
                        </li>
                      )}
                      {r.habito && (
                        <li>
                          Separa em casa: <strong>{rotuloHabito(r.habito)}</strong>
                        </li>
                      )}
                    </ul>
                    {r.motivos?.length > 0 && (
                      <ul className="resposta-motivos">
                        {r.motivos.map((m) => (
                          <li key={m}>{rotuloMotivo(m)}</li>
                        ))}
                      </ul>
                    )}
                    {r.detalhes &&
                      Object.entries(r.detalhes).map(([tema, texto]) => (
                        <p key={tema} className="resposta-texto">
                          <strong>O que aconteceu ({TEMAS_PESQUISA.find((t) => t.id === tema)?.rotulo ?? tema}):</strong> {texto}
                        </p>
                      ))}
                  </>
                )}
                {r.texto && <p className="resposta-texto">{r.texto}</p>}
                {(r.nome || r.apartamento) && (
                  <p className="resposta-autor">
                    {[r.nome, r.apartamento && `apto ${r.apartamento}`].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="resposta-acoes">
                  <button type="button" className="link-botao" onClick={() => alternarLida(r)}>
                    {r.lida ? "Marcar como não lida" : "Marcar como lida"}
                  </button>
                  <button type="button" className="link-botao link-perigo" onClick={() => apagar(r)}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {temMais && (
            <button type="button" className="botao botao-secundario botao-largo" onClick={carregarMais}>
              Carregar mais
            </button>
          )}
        </>
      )}
    </section>
  );
}
