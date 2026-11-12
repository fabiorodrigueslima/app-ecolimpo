import { useEffect, useState } from "react";
import { hojeISO, rotuloDataAviso, textoModeloAviso, validarAviso, linhaDoAviso, TEXTO_MAXIMO } from "../lib/avisos.js";

const VAZIO = { condominio_id: "", data: "", inicio: "09:00", fim: "12:00", texto: "", notificar: true };

// Formulário para publicar um aviso (o texto vem do modelo da mobilização e pode ser editado).
function NovoAviso({ condominios, aoPublicar }) {
  const [dados, setDados] = useState(VAZIO);
  const [editouTexto, setEditouTexto] = useState(false);
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [falha, setFalha] = useState("");

  const nome = condominios.find((c) => c.id === dados.condominio_id)?.nome ?? "";
  const modelo = nome && dados.data ? textoModeloAviso({ nome, data: dados.data, inicio: dados.inicio, fim: dados.fim }) : "";
  const texto = editouTexto ? dados.texto : modelo;

  const mudar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  async function publicar(e) {
    e.preventDefault();
    const aviso = { ...dados, texto };
    const conferido = validarAviso(aviso);
    if (!conferido.ok) return setErros(conferido.erros);
    setOcupado(true);
    setFalha("");
    const r = await aoPublicar(linhaDoAviso(aviso));
    setOcupado(false);
    if (r.ok) {
      setDados(VAZIO);
      setEditouTexto(false);
    } else {
      setFalha("Não foi possível publicar. Confira a internet e tente de novo.");
    }
  }

  return (
    <form className="painel-caixa painel-form" onSubmit={publicar} noValidate>
      <h2>Novo aviso</h2>

      <label className="campo">
        <span>Condomínio</span>
        <select value={dados.condominio_id} onChange={(e) => mudar("condominio_id", e.target.value)}>
          <option value="">Escolha…</option>
          {condominios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        {erros.condominio_id && <span className="erro">{erros.condominio_id}</span>}
      </label>

      <label className="campo">
        <span>Dia da ação</span>
        <input type="date" value={dados.data} min={hojeISO()} onChange={(e) => mudar("data", e.target.value)} />
        {erros.data && <span className="erro">{erros.data}</span>}
      </label>

      <div className="aviso-horas">
        <label className="campo">
          <span>Das</span>
          <input type="time" value={dados.inicio} onChange={(e) => mudar("inicio", e.target.value)} />
        </label>
        <label className="campo">
          <span>Até</span>
          <input type="time" value={dados.fim} onChange={(e) => mudar("fim", e.target.value)} />
        </label>
      </div>

      <label className="campo">
        <span>Texto do aviso</span>
        <textarea
          rows={5}
          maxLength={TEXTO_MAXIMO}
          value={texto}
          placeholder="Escolha o condomínio e o dia: o texto aparece aqui pronto, e você pode mudar."
          onChange={(e) => {
            setEditouTexto(true);
            mudar("texto", e.target.value);
          }}
        />
        <span className="dica">
          {texto.length}/{TEXTO_MAXIMO} letras
          {editouTexto && (
            <>
              {" · "}
              <button
                type="button"
                className="link-botao"
                onClick={() => {
                  setEditouTexto(false);
                  mudar("texto", "");
                }}
              >
                voltar ao texto do modelo
              </button>
            </>
          )}
        </span>
        {erros.texto && <span className="erro">{erros.texto}</span>}
      </label>

      <label className="marcar">
        <input type="checkbox" checked={dados.notificar} onChange={(e) => mudar("notificar", e.target.checked)} />
        Avisar também no celular, às 6h30 do dia da ação (para quem ligou o lembrete)
      </label>

      {falha && (
        <p className="erro erro-bloco" role="alert">
          {falha}
        </p>
      )}
      <div className="botoes">
        <button type="submit" className="botao botao-primario" disabled={ocupado}>
          {ocupado ? "Publicando…" : "Publicar aviso"}
        </button>
      </div>
    </form>
  );
}

export default function Avisos({ api }) {
  const [avisos, setAvisos] = useState([]);
  const [condominios, setCondominios] = useState([]);
  const [estado, setEstado] = useState("carregando");
  const [aviso, setAviso] = useState("");
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    Promise.all([api.listarAvisos(hojeISO()), api.listarCondominios()]).then(([lista, conds]) => {
      if (!ativo) return;
      if (!lista.ok || !conds.ok) return setEstado("erro");
      setAvisos(lista.dados);
      setCondominios(conds.dados.filter((c) => c.ativo));
      setEstado("pronto");
    });
    return () => {
      ativo = false;
    };
  }, [api, versao]);

  const nomeDe = (id) => condominios.find((c) => c.id === id)?.nome ?? id;

  async function publicar(linha) {
    const r = await api.criarAviso(linha);
    if (r.ok) {
      setAviso("Aviso publicado. Ele já aparece no app dos moradores desse condomínio.");
      setVersao((v) => v + 1);
    }
    return r;
  }

  async function apagar(item) {
    if (!window.confirm(`Apagar o aviso de ${rotuloDataAviso(item.data)} para ${nomeDe(item.condominio_id)}?`)) return;
    const r = await api.apagarAviso(item.id);
    setAviso(r.ok ? "Aviso apagado. Ele saiu do app dos moradores." : "");
    if (r.ok) setVersao((v) => v + 1);
  }

  return (
    <section className="painel-secao" aria-labelledby="avisos-titulo">
      <div className="secao-topo">
        <h1 id="avisos-titulo">Avisos aos moradores</h1>
      </div>
      <p className="dica">
        Use para avisar uma ação de mobilização (ou outra novidade). O aviso aparece na tela inicial do app dos moradores
        do condomínio até o fim do dia da ação, e depois some sozinho.
      </p>

      {aviso && (
        <p className="aviso-ok" role="status">
          {aviso}
        </p>
      )}
      {estado === "carregando" && <p className="carregando">Carregando…</p>}
      {estado === "erro" && (
        <p className="erro erro-bloco" role="alert">
          Não foi possível carregar os avisos.{" "}
          <button type="button" className="link-botao" onClick={() => setVersao((v) => v + 1)}>
            Tentar de novo
          </button>
        </p>
      )}

      {estado === "pronto" && (
        <>
          <h2 className="avisos-subtitulo">Publicados</h2>
          {avisos.length === 0 && <p className="vazio">Nenhum aviso de hoje em diante.</p>}
          <ul className="avisos-lista">
            {avisos.map((item) => (
              <li key={item.id} className="aviso-item">
                <div>
                  <strong>
                    {rotuloDataAviso(item.data)} · {nomeDe(item.condominio_id)}
                  </strong>
                  <p>{item.texto}</p>
                  <p className="dica">{item.notificar ? "Vai avisar no celular às 6h30 do dia." : "Só aparece no app."}</p>
                </div>
                <button type="button" className="botao botao-secundario" onClick={() => apagar(item)}>
                  Apagar
                </button>
              </li>
            ))}
          </ul>
          <NovoAviso condominios={condominios} aoPublicar={publicar} />
        </>
      )}
    </section>
  );
}
