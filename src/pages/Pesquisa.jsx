import { TEMAS_PESQUISA, LIMITES, validarPesquisa, montarPesquisa } from "../lib/formularios.js";
import { Cabecalho, CamposOpcionais } from "../components/Comuns.jsx";
import { CampoCondominio, Obrigado, BotaoEnviar } from "../components/Formulario.jsx";
import { useFormulario } from "../lib/useFormulario.js";

const LEGENDAS = { 1: "Muito ruim", 2: "Ruim", 3: "Regular", 4: "Bom", 5: "Muito bom" };

function Notas({ tema, valor, mudar, erro }) {
  return (
    <fieldset className="grupo">
      <legend>{tema.rotulo}</legend>
      <div className="notas" role="radiogroup" aria-label={`Nota para ${tema.rotulo}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`nota ${valor === n ? "nota-marcada" : ""}`} title={LEGENDAS[n]}>
            <input
              type="radio"
              name={`nota-${tema.id}`}
              value={n}
              checked={valor === n}
              onChange={() => mudar(tema.id, n)}
            />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <div className="notas-legenda" aria-hidden="true">
        <span>Muito ruim</span>
        <span>Muito bom</span>
      </div>
      {valor && <p className="nota-escolhida">{LEGENDAS[valor]}</p>}
      {erro && <span className="erro">{erro}</span>}
    </fieldset>
  );
}

export default function Pesquisa({ condominio }) {
  const { dados, mudar, limparErro, erros, estado, enviar } = useFormulario(
    { condominioId: condominio.id, notas: {}, melhorar: "", nome: "", apartamento: "" },
    validarPesquisa,
    montarPesquisa,
  );

  if (estado === "enviado") return <Obrigado titulo="Obrigado pela avaliação!" />;

  const mudarNota = (tema, n) => {
    mudar("notas", { ...dados.notas, [tema]: n });
    limparErro(`nota_${tema}`);
  };

  return (
    <form className="pagina" onSubmit={enviar} noValidate>
      <Cabecalho
        titulo="Pesquisa de satisfação"
        subtitulo="Dê uma nota de 1 (muito ruim) a 5 (muito bom)."
        voltar="/fale"
      />

      <CampoCondominio valor={dados.condominioId} mudar={mudar} erro={erros.condominioId} />

      {TEMAS_PESQUISA.map((t) => (
        <Notas key={t.id} tema={t} valor={dados.notas[t.id]} mudar={mudarNota} erro={erros[`nota_${t.id}`]} />
      ))}

      <label className="campo">
        <span>
          O que precisa melhorar? <span className="opcional">(opcional)</span>
        </span>
        <textarea
          rows={4}
          value={dados.melhorar}
          onChange={(e) => mudar("melhorar", e.target.value)}
          maxLength={LIMITES.texto}
        />
        {erros.melhorar && <span className="erro">{erros.melhorar}</span>}
      </label>

      <CamposOpcionais dados={dados} mudar={mudar} erros={erros} />
      <BotaoEnviar estado={estado} />
    </form>
  );
}
