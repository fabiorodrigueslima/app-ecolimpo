import { useEffect, useState } from "react";
import { NOMES_DIAS, descreverDias, formatarHorario } from "../lib/coleta.js";
import { gerarId, validarCondominio, situacaoLembrete } from "./regras.js";

const VAZIO = { nome: "", regiao: "", dias: [], horario: "", piloto: false, ativo: true };

function Formulario({ inicial, novo, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState(inicial);
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [falha, setFalha] = useState("");

  const mudar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };
  const alternarDia = (dia) =>
    mudar("dias", dados.dias.includes(dia) ? dados.dias.filter((d) => d !== dia) : [...dados.dias, dia]);

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

      <fieldset className="grupo">
        <legend>Dias da coleta</legend>
        <div className="chips">
          {NOMES_DIAS.map((nome, dia) => (
            <label key={dia} className={`chip ${dados.dias.includes(dia) ? "chip-marcado" : ""}`}>
              <input type="checkbox" checked={dados.dias.includes(dia)} onChange={() => alternarDia(dia)} />
              {nome.replace("-feira", "")}
            </label>
          ))}
        </div>
        {erros.dias && <span className="erro">{erros.dias}</span>}
      </fieldset>

      <fieldset className="grupo">
        <legend>Horário de entrada da coleta</legend>
        <div className="chips">
          {[
            ["09:00", "9h (manhã)"],
            ["14:00", "14h (tarde)"],
          ].map(([valor, rotulo]) => (
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
  const [versao, setVersao] = useState(0); // muda para recarregar

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
      editando === "novo" ? VAZIO : { ...VAZIO, ...editando, regiao: editando.regiao ?? "", dias: editando.dias ?? [] };
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
              <p className="dica">Lembrete ligado: {inscritos[c.id] ?? 0} morador(es)</p>
            </div>
            <div className="botoes">
              {c.ativo && (
                <a className="botao botao-secundario" href={`/cartaz?c=${encodeURIComponent(c.id)}`} target="_blank" rel="noreferrer">
                  Cartaz
                </a>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
