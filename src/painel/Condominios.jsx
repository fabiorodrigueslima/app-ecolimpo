import { useEffect, useState } from "react";
import { NOMES_DIAS, HORARIOS_VALIDOS, descreverDias, formatarHorario, periodoDoHorario } from "../lib/coleta.js";
import {
  gerarId,
  validarCondominio,
  situacaoLembrete,
  mensagemWhatsApp,
  linkWhatsApp,
  inicioDoPeriodo,
  somarContagens,
  resumoDoUso,
} from "./regras.js";

// Caixa com o texto pronto para o síndico mandar no WhatsApp dos moradores.
function MensagemWhatsApp({ condominio, aoFechar }) {
  const texto = mensagemWhatsApp(condominio);
  const [copiado, setCopiado] = useState("");

  async function copiar(e) {
    const caixa = e.currentTarget.closest(".mensagem-whatsapp").querySelector("textarea");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado("Texto copiado. Agora é só colar no WhatsApp.");
    } catch {
      caixa.select();
      setCopiado("Não deu para copiar sozinho: o texto ficou selecionado, use Copiar do celular/computador.");
    }
  }

  return (
    <div className="mensagem-whatsapp">
      <h3>Mensagem para o WhatsApp</h3>
      <p className="dica">
        Mande para o síndico divulgar no grupo dos moradores. Confira o texto antes de enviar.
      </p>
      <textarea readOnly value={texto} rows={14} aria-label="Texto da mensagem" />
      {copiado && (
        <p className="aviso-ok" role="status">
          {copiado}
        </p>
      )}
      <div className="botoes">
        <button type="button" className="botao botao-primario" onClick={copiar}>
          Copiar texto
        </button>
        <a className="botao botao-secundario" href={linkWhatsApp(texto)} target="_blank" rel="noreferrer">
          Abrir no WhatsApp
        </a>
        <button type="button" className="botao botao-secundario" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </div>
  );
}

const VAZIO = { nome: "", regiao: "", dias: [], dias_poda: [], horario: "", piloto: false, ativo: true };

// Fileira de dias da semana para marcar (usada nos recicláveis e nas podas).
function EscolherDias({ legenda, dica, campo, dados, erro, mudar }) {
  const marcados = dados[campo];
  const alternar = (dia) => mudar(campo, marcados.includes(dia) ? marcados.filter((d) => d !== dia) : [...marcados, dia]);
  return (
    <fieldset className="grupo">
      <legend>{legenda}</legend>
      {dica && <p className="dica">{dica}</p>}
      <div className="chips">
        {NOMES_DIAS.map((nome, dia) => (
          <label key={dia} className={`chip ${marcados.includes(dia) ? "chip-marcado" : ""}`}>
            <input type="checkbox" checked={marcados.includes(dia)} onChange={() => alternar(dia)} />
            {nome.replace("-feira", "")}
          </label>
        ))}
      </div>
      {erro && <span className="erro">{erro}</span>}
    </fieldset>
  );
}

function Formulario({ inicial, novo, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [falha, setFalha] = useState("");

  const mudar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  async function enviar(e) {
    e.preventDefault();
    const conferido = validarCondominio(dados);
    if (!conferido.ok) return setErros(conferido.erros);
    setOcupado(true);
    setFalha("");
    const r = await aoSalvar(dados);
    setOcupado(false);
    if (!r.ok) setFalha("Não foi possível salvar. Confira a internet e tente de novo.");
  }

  return (
    <form className="painel-caixa painel-form" onSubmit={enviar} noValidate>
      <h2>{novo ? "Novo condomínio" : `Editar: ${inicial.nome}`}</h2>

      <label className="campo">
        <span>Nome do condomínio</span>
        <input type="text" value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} maxLength={100} />
        {erros.nome && <span className="erro">{erros.nome}</span>}
      </label>

      <label className="campo">
        <span>
          Bairro / região <span className="opcional">(opcional)</span>
        </span>
        <input type="text" value={dados.regiao} onChange={(e) => mudar("regiao", e.target.value)} maxLength={100} />
        {erros.regiao && <span className="erro">{erros.regiao}</span>}
      </label>

      <EscolherDias legenda="Dias da coleta seletiva (recicláveis)" campo="dias" dados={dados} erro={erros.dias} mudar={mudar} />
      <EscolherDias
        legenda="Dias da coleta de podas (opcional)"
        dica="Só para condomínio que tem coleta de galhos, grama e folhas. As regras da poda aparecem no app só para ele."
        campo="dias_poda"
        dados={dados}
        erro={erros.dias_poda}
        mudar={mudar}
      />

      <fieldset className="grupo">
        <legend>Horário de entrada da coleta</legend>
        <div className="chips">
          {HORARIOS_VALIDOS.map((valor) => [valor, `${formatarHorario(valor)} (${periodoDoHorario(valor)})`]).map(([valor, rotulo]) => (
            <label key={valor} className={`chip ${dados.horario === valor ? "chip-marcado" : ""}`}>
              <input
                type="radio"
                name="horario"
                checked={dados.horario === valor}
                onChange={() => mudar("horario", valor)}
              />
              {rotulo}
            </label>
          ))}
        </div>
        {erros.horario && <span className="erro">{erros.horario}</span>}
      </fieldset>

      <label className="marcar">
        <input type="checkbox" checked={dados.piloto} onChange={(e) => mudar("piloto", e.target.checked)} />
        Faz parte do teste piloto
      </label>
      <label className="marcar">
        <input type="checkbox" checked={dados.ativo} onChange={(e) => mudar("ativo", e.target.checked)} />
        Ativo (aparece no app para os moradores)
      </label>

      {falha && (
        <p className="erro erro-bloco" role="alert">
          {falha}
        </p>
      )}
      <div className="botoes">
        <button type="submit" className="botao botao-primario" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar} disabled={ocupado}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Condominios({ api }) {
  const [lista, setLista] = useState([]);
  const [inscritos, setInscritos] = useState({});
  const [lembrete, setLembrete] = useState(null);
  const [estado, setEstado] = useState("carregando");
  const [editando, setEditando] = useState(null); // null | "novo" | condomínio
  const [aviso, setAviso] = useState("");
  const [mensagemDe, setMensagemDe] = useState(null); // id do condomínio com a mensagem aberta
  const [versao, setVersao] = useState(0); // muda para recarregar
  const [periodo, setPeriodo] = useState(30); // dias dos contadores de uso
  const [uso, setUso] = useState(null); // null = ainda sem contadores (SQL 017 não rodado ou erro)

  useEffect(() => {
    let ativo = true;
    Promise.all([api.listarCondominios(), api.contarInscricoes(), api.ultimoEnvioLembrete()]).then(
      ([conds, contagem, envio]) => {
        if (!ativo) return;
        if (!conds.ok) return setEstado("erro");
        setLista(conds.dados);
        if (contagem.ok) setInscritos(Object.fromEntries(contagem.dados.map((c) => [c.condominio_id, Number(c.total)])));
        setLembrete(envio.ok ? situacaoLembrete(envio.dados[0] ?? null) : null);
        setEstado("pronto");
      },
    );
    return () => {
      ativo = false;
    };
  }, [api, versao]);

  useEffect(() => {
    let ativo = true;
    api.listarContagens(inicioDoPeriodo(periodo)).then((r) => {
      if (ativo) setUso(r.ok ? somarContagens(r.dados) : null);
    });
    return () => {
      ativo = false;
    };
  }, [api, versao, periodo]);

  async function salvar(dados) {
    const r =
      editando === "novo"
        ? await api.criarCondominio(
            gerarId(
              dados.nome,
              lista.map((c) => c.id),
            ),
            dados,
          )
        : await api.editarCondominio(editando.id, dados);
    if (r.ok) {
      setAviso(editando === "novo" ? "Condomínio cadastrado." : "Alterações salvas.");
      setEditando(null);
      setVersao((v) => v + 1);
    }
    return r;
  }

  if (editando) {
    const inicial =
      editando === "novo" ? VAZIO : { ...VAZIO, ...editando, regiao: editando.regiao ?? "", dias: editando.dias ?? [], dias_poda: editando.dias_poda ?? [] };
    return (
      <section className="painel-secao">
        <Formulario
          inicial={inicial}
          novo={editando === "novo"}
          aoSalvar={salvar}
          aoCancelar={() => setEditando(null)}
        />
      </section>
    );
  }

  return (
    <section className="painel-secao" aria-labelledby="condominios-titulo">
      <div className="secao-topo">
        <h1 id="condominios-titulo">Condomínios atendidos</h1>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => {
            setAviso("");
            setEditando("novo");
          }}
        >
          + Novo condomínio
        </button>
      </div>
      <p className="dica">
        O que for salvo aqui aparece no app dos moradores e é usado pelo lembrete das 6h30. Para tirar um condomínio do
        app, desmarque “Ativo”.
      </p>

      {lembrete && (
        <div className={`situacao situacao-${lembrete.nivel}`} role="status">
          <strong>🔔 {lembrete.titulo}</strong>
          <span>{lembrete.detalhe}</span>
        </div>
      )}

      <div className="uso-periodo">
        <label className="campo campo-simples">
          <span>Contadores de uso do app</span>
          <select value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}>
            <option value={1}>Hoje</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </label>
        {uso ? (
          <p className="dica">
            Só números, sem saber quem foi. Abriu sem escolher condomínio: {uso[""]?.abertura ?? 0} · WhatsApp sem
            condomínio: {uso[""]?.whatsapp ?? 0}. Celulares que entraram no painel não são contados.
          </p>
        ) : (
          <p className="dica">Contadores ainda não ligados (falta rodar o SQL 017 no Supabase).</p>
        )}
      </div>

      {aviso && (
        <p className="aviso-ok" role="status">
          {aviso}
        </p>
      )}
      {estado === "carregando" && <p className="carregando">Carregando…</p>}
      {estado === "erro" && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível carregar os condomínios.{" "}
          <button type="button" className="link-botao" onClick={() => setVersao((v) => v + 1)}>
            Tentar de novo
          </button>
        </p>
      )}
      {estado === "pronto" && lista.length === 0 && <p className="vazio">Nenhum condomínio cadastrado ainda.</p>}

      <ul className="condominios">
        {lista.map((c) => (
          <li key={c.id} className={`condominio ${c.ativo ? "" : "condominio-inativo"}`}>
            <div>
              <h2>
                {c.nome}
                {c.piloto && <span className="etiqueta etiqueta-piloto">Piloto</span>}
                {!c.ativo && <span className="etiqueta">Inativo</span>}
              </h2>
              {c.regiao && <p className="dica">{c.regiao}</p>}
              <p>
                {descreverDias(c.dias ?? [])} · às {formatarHorario(c.horario)}
              </p>
              {c.dias_poda?.length > 0 && <p>Podas: {descreverDias(c.dias_poda)}</p>}
              <p className="dica">Lembrete ligado: {inscritos[c.id] ?? 0} morador(es)</p>
              {uso && (
                <p className="dica">
                  Uso ({periodo === 1 ? "hoje" : `últimos ${periodo} dias`}): {resumoDoUso(uso[c.id])}
                </p>
              )}
            </div>
            <div className="botoes">
              {c.ativo && (
                <a className="botao botao-secundario" href={`/cartaz?c=${encodeURIComponent(c.id)}`} target="_blank" rel="noreferrer">
                  Cartaz
                </a>
              )}
              {c.ativo && (
                <button
                  type="button"
                  className="botao botao-secundario"
                  aria-expanded={mensagemDe === c.id}
                  onClick={() => setMensagemDe(mensagemDe === c.id ? null : c.id)}
                >
                  WhatsApp
                </button>
              )}
              <button
                type="button"
                className="botao botao-secundario"
                onClick={() => {
                  setAviso("");
                  setEditando(c);
                }}
              >
                Editar
              </button>
            </div>
            {mensagemDe === c.id && c.ativo && (
              <MensagemWhatsApp key={`${c.id}-${versao}`} condominio={c} aoFechar={() => setMensagemDe(null)} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
