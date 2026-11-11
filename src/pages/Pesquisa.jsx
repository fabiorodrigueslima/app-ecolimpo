import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TEMAS_PESQUISA,
  LIMITES,
  validarPesquisa,
  montarPesquisa,
  pesquisaVazia,
  notaBaixa,
  mesDeReferencia,
  jaRespondeuNoMes,
} from "../lib/formularios.js";
import { ESCALA, NAO_SEI, PERGUNTA_NPS, PERGUNTA_HABITO, HABITOS, PERGUNTA_MELHORAR } from "../data/pesquisa.js";
import { lerMesDaPesquisa, salvarMesDaPesquisa } from "../lib/armazenamento.js";
import { CamposOpcionais, AvisoPrivacidade } from "../components/Comuns.jsx";
import { CampoCondominio, Obrigado, BotaoEnviar } from "../components/Formulario.jsx";
import { IconeVoltar, IconeEstrela } from "../components/Icones.jsx";
import { useFormulario } from "../lib/useFormulario.js";

// Ordem das telas. "inicio" não conta no "Pergunta X de Y".
const PASSOS = ["inicio", ...TEMAS_PESQUISA.map((t) => t.id), "nps", "habito", "final"];
const TOTAL_PERGUNTAS = PASSOS.length - 1;

// Quais erros pertencem a cada tela.
function camposDoPasso(passo) {
  if (passo === "inicio") return ["condominioId"];
  if (passo === "nps") return ["nps"];
  if (passo === "habito") return ["habito"];
  if (passo === "final") return ["melhorar", "nome", "apartamento"];
  return [`nota_${passo}`, `detalhe_${passo}`];
}

function Escala({ tema, valor, aoEscolher }) {
  return (
    <div className="escala" role="radiogroup" aria-label={tema.pergunta}>
      {ESCALA.map((e) => (
        <label key={e.valor} className={`escala-opcao ${valor === e.valor ? "marcada" : ""}`}>
          <input type="radio" name={`nota-${tema.id}`} checked={valor === e.valor} onChange={() => aoEscolher(e.valor)} />
          <span className="escala-emoji" aria-hidden="true">
            {e.emoji}
          </span>
          <span className="escala-rotulo">{e.rotulo}</span>
        </label>
      ))}
      <label className={`escala-nao-sei ${valor === NAO_SEI.valor ? "marcada" : ""}`}>
        <input
          type="radio"
          name={`nota-${tema.id}`}
          checked={valor === NAO_SEI.valor}
          onChange={() => aoEscolher(NAO_SEI.valor)}
        />
        {NAO_SEI.rotulo}
      </label>
    </div>
  );
}

function OQueAconteceu({ tema, dados, mudar, erro }) {
  const marcados = dados.motivos[tema.id] ?? [];
  const alternar = (id) =>
    mudar("motivos", {
      ...dados.motivos,
      [tema.id]: marcados.includes(id) ? marcados.filter((m) => m !== id) : [...marcados, id],
    });
  return (
    <fieldset className="grupo o-que-aconteceu">
      <legend>
        O que aconteceu? <span className="opcional">(pode marcar mais de um)</span>
      </legend>
      <div className="chips">
        {tema.motivos.map((m) => (
          <label key={m.id} className={`chip ${marcados.includes(m.id) ? "chip-marcado" : ""}`}>
            <input type="checkbox" checked={marcados.includes(m.id)} onChange={() => alternar(m.id)} />
            {m.rotulo}
          </label>
        ))}
      </div>
      <label className="campo campo-simples">
        <span>
          Quer contar mais? <span className="opcional">(opcional)</span>
        </span>
        <textarea
          rows={3}
          value={dados.detalhes[tema.id] ?? ""}
          onChange={(e) => mudar("detalhes", { ...dados.detalhes, [tema.id]: e.target.value })}
          maxLength={LIMITES.detalhe}
        />
      </label>
      {erro && <span className="erro">{erro}</span>}
    </fieldset>
  );
}

export default function Pesquisa({ condominio }) {
  const [jaRespondeu] = useState(() => jaRespondeuNoMes(lerMesDaPesquisa()));
  const [passo, setPasso] = useState(0);
  const { dados, mudar, erros, setErros, estado, enviar, idsCondominios } = useFormulario(
    pesquisaVazia(condominio.id),
    validarPesquisa,
    montarPesquisa,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [passo]);

  useEffect(() => {
    if (estado === "enviado") salvarMesDaPesquisa(mesDeReferencia());
  }, [estado]);

  if (estado === "enviado") {
    return (
      <Obrigado
        titulo="Obrigado pela avaliação!"
        texto="Sua opinião foi registrada. A equipe da cooperativa usa as avaliações para melhorar a coleta no seu condomínio."
      />
    );
  }

  if (jaRespondeu) {
    return (
      <div className="pagina obrigado">
        <span className="obrigado-icone">
          <IconeEstrela tamanho={36} />
        </span>
        <h1>Você já avaliou este mês</h1>
        <p>Obrigado! Para os números ficarem justos, cada celular responde uma vez por mês. Volte no próximo mês.</p>
        <Link to="/fale/mensagem" className="botao botao-primario botao-largo">
          Quero enviar uma mensagem
        </Link>
        <Link to="/" className="link-pequeno">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const atual = PASSOS[passo];
  const tema = TEMAS_PESQUISA.find((t) => t.id === atual);

  function avancar() {
    const conferido = validarPesquisa(dados, idsCondominios);
    const doPasso = Object.fromEntries(camposDoPasso(atual).filter((c) => conferido.erros[c]).map((c) => [c, conferido.erros[c]]));
    if (Object.keys(doPasso).length) {
      setErros((e) => ({ ...e, ...doPasso }));
      return;
    }
    setPasso((p) => p + 1);
  }

  function escolherNota(valor) {
    mudar("notas", { ...dados.notas, [tema.id]: valor });
    setErros((e) => ({ ...e, [`nota_${tema.id}`]: undefined }));
  }

  return (
    <form
      className="pagina pesquisa"
      noValidate
      onSubmit={(e) => {
        if (atual !== "final") {
          e.preventDefault();
          avancar();
        } else enviar(e);
      }}
    >
      {atual === "inicio" ? (
        <div className="pesquisa-abertura">
          <Link to="/fale" className="voltar">
            <IconeVoltar tamanho={18} /> Voltar
          </Link>
          <p className="sobretitulo">Pesquisa de satisfação</p>
          <h1>Como está a coleta seletiva no seu condomínio?</h1>
          <ul className="pesquisa-garantias">
            <li>Leva menos de 1 minuto ({TOTAL_PERGUNTAS} perguntas rápidas).</li>
            <li>Você pode responder sem se identificar.</li>
            <li>Suas respostas ajudam a cooperativa a melhorar o serviço.</li>
          </ul>
          <CampoCondominio valor={dados.condominioId} mudar={mudar} erro={erros.condominioId} />
        </div>
      ) : (
        <div className="progresso" aria-label={`Pergunta ${passo} de ${TOTAL_PERGUNTAS}`}>
          <div className="progresso-texto">
            Pergunta {passo} de {TOTAL_PERGUNTAS}
          </div>
          <div className="progresso-trilho" aria-hidden="true">
            <span style={{ width: `${(passo / TOTAL_PERGUNTAS) * 100}%` }} />
          </div>
        </div>
      )}

      {tema && (
        <section className="pergunta" aria-labelledby={`p-${tema.id}`}>
          <p className="sobretitulo">{tema.rotulo}</p>
          <h1 id={`p-${tema.id}`}>{tema.pergunta}</h1>
          <Escala tema={tema} valor={dados.notas[tema.id]} aoEscolher={escolherNota} />
          {erros[`nota_${tema.id}`] && <span className="erro">{erros[`nota_${tema.id}`]}</span>}
          {notaBaixa(dados.notas[tema.id]) && (
            <OQueAconteceu tema={tema} dados={dados} mudar={mudar} erro={erros[`detalhe_${tema.id}`]} />
          )}
        </section>
      )}

      {atual === "nps" && (
        <section className="pergunta" aria-labelledby="p-nps">
          <p className="sobretitulo">Recomendação</p>
          <h1 id="p-nps">{PERGUNTA_NPS}</h1>
          <div className="nps" role="radiogroup" aria-label={PERGUNTA_NPS}>
            {Array.from({ length: 11 }, (_, n) => (
              <label key={n} className={`nps-opcao ${dados.nps === n ? "marcada" : ""}`}>
                <input type="radio" name="nps" checked={dados.nps === n} onChange={() => mudar("nps", n)} />
                {n}
              </label>
            ))}
          </div>
          <div className="nps-legenda" aria-hidden="true">
            <span>0 = Nada provável</span>
            <span>10 = Muito provável</span>
          </div>
          {erros.nps && <span className="erro">{erros.nps}</span>}
        </section>
      )}

      {atual === "habito" && (
        <section className="pergunta" aria-labelledby="p-habito">
          <p className="sobretitulo">Seu hábito</p>
          <h1 id="p-habito">{PERGUNTA_HABITO}</h1>
          <div className="opcoes-grandes" role="radiogroup" aria-label={PERGUNTA_HABITO}>
            {HABITOS.map((h) => (
              <label key={h.id} className={`opcao ${dados.habito === h.id ? "opcao-marcada" : ""}`}>
                <input type="radio" name="habito" checked={dados.habito === h.id} onChange={() => mudar("habito", h.id)} />
                <span className="opcao-texto">
                  <strong>{h.rotulo}</strong>
                </span>
              </label>
            ))}
          </div>
          {erros.habito && <span className="erro">{erros.habito}</span>}
        </section>
      )}

      {atual === "final" && (
        <section className="pergunta" aria-labelledby="p-final">
          <p className="sobretitulo">Para terminar</p>
          <h1 id="p-final">{PERGUNTA_MELHORAR}</h1>
          <label className="campo">
            <span>
              Sua sugestão <span className="opcional">(opcional)</span>
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
          <AvisoPrivacidade />
        </section>
      )}

      <div className="pesquisa-navegacao">
        {passo > 0 && (
          <button type="button" className="botao botao-secundario" onClick={() => setPasso((p) => p - 1)}>
            Voltar
          </button>
        )}
        {atual === "final" ? (
          <BotaoEnviar estado={estado} />
        ) : (
          <button type="submit" className="botao botao-primario">
            {atual === "inicio" ? "Começar" : "Próxima"}
          </button>
        )}
      </div>
    </form>
  );
}
