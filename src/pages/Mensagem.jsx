import { useLocation } from "react-router-dom";
import { TIPOS_MENSAGEM, LIMITES, validarMensagem, montarMensagem, tipoDoLink } from "../lib/formularios.js";
import { Cabecalho, CamposOpcionais } from "../components/Comuns.jsx";
import { CampoCondominio, Obrigado, BotaoEnviar } from "../components/Formulario.jsx";
import { useFormulario } from "../lib/useFormulario.js";

export default function Mensagem({ condominio }) {
  const { search } = useLocation();
  const tipoInicial = tipoDoLink(search);
  const veioDaDuvida = tipoInicial === "duvida";
  const { dados, mudar, erros, estado, enviar } = useFormulario(
    { condominioId: condominio.id, tipo: tipoInicial, texto: "", nome: "", apartamento: "" },
    validarMensagem,
    montarMensagem,
  );

  if (estado === "enviado") return <Obrigado titulo={veioDaDuvida ? "Dúvida recebida!" : "Mensagem recebida!"} />;

  return (
    <form className="pagina" onSubmit={enviar} noValidate>
      <Cabecalho
        titulo={veioDaDuvida ? "Enviar dúvida" : "Enviar mensagem"}
        subtitulo={
          veioDaDuvida ? "Conte qual material gerou a dúvida. A equipe da cooperativa lê todas." : "A cooperativa lê todas as mensagens."
        }
        voltar={veioDaDuvida ? "/recicla" : "/fale"}
      />

      <CampoCondominio valor={dados.condominioId} mudar={mudar} erro={erros.condominioId} />

      <fieldset className="grupo">
        <legend>
          Tipo de mensagem <span className="obrigatorio">(obrigatório)</span>
        </legend>
        <div className="chips">
          {TIPOS_MENSAGEM.map((t) => (
            <label key={t.id} className={`chip ${dados.tipo === t.id ? "chip-marcado" : ""}`}>
              <input
                type="radio"
                name="tipo"
                value={t.id}
                checked={dados.tipo === t.id}
                onChange={() => mudar("tipo", t.id)}
              />
              {t.rotulo}
            </label>
          ))}
        </div>
        {erros.tipo && <span className="erro">{erros.tipo}</span>}
      </fieldset>

      <label className="campo">
        <span>
          Sua mensagem <span className="obrigatorio">(obrigatório)</span>
        </span>
        <textarea
          rows={5}
          value={dados.texto}
          onChange={(e) => mudar("texto", e.target.value)}
          maxLength={LIMITES.texto}
          placeholder={veioDaDuvida ? "Ex.: Posso colocar caixa de pizza na coleta seletiva?" : undefined}
        />
        <small className="contador">
          {dados.texto.length}/{LIMITES.texto}
        </small>
        {erros.texto && <span className="erro">{erros.texto}</span>}
      </label>

      <CamposOpcionais dados={dados} mudar={mudar} erros={erros} />
      <p className="dica">Não escreva CPF, telefone ou endereço completo na mensagem.</p>
      <BotaoEnviar estado={estado} />
    </form>
  );
}
