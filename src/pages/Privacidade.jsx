import { contatos } from "../data/contatos.js";
import { privacidade } from "../data/privacidade.js";
import { Cabecalho } from "../components/Comuns.jsx";

export default function Privacidade() {
  return (
    <article className="pagina texto-longo">
      <Cabecalho titulo="Política de privacidade" subtitulo={`Última atualização: ${privacidade.atualizadaEm}`} voltar="/" />

      <p>
        Este aplicativo é da <strong>{contatos.nomeOficial}</strong>. Pedimos o mínimo de informações possível, seguindo
        a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>

      <h2>O que fica guardado só no seu celular</h2>
      <ul>
        <li>
          <strong>O condomínio que você escolheu</strong>, para mostrar o dia da sua coleta. Essa informação não é
          enviada para a cooperativa. Você pode trocar a qualquer momento, ou apagar limpando os dados do navegador.
        </li>
      </ul>

      <h2>O que é enviado para a cooperativa</h2>
      <ul>
        <li>
          <strong>Pesquisa de satisfação e mensagens:</strong> o condomínio (obrigatório), as notas ou o texto que você
          escreveu e, só se você quiser, seu nome e apartamento.
        </li>
        <li>
          <strong>Lembrete da coleta (quando você ativar):</strong> um código técnico do seu navegador para enviar o aviso
          e o condomínio escolhido. Não guardamos seu número de telefone.
        </li>
      </ul>
      <p>
        Nunca pedimos CPF, telefone, e-mail ou endereço completo. Por favor, não escreva esses dados nas mensagens.
      </p>

      <h2>Para que usamos</h2>
      <ul>
        <li>Melhorar a coleta seletiva e a orientação aos moradores.</li>
        <li>Responder dúvidas e reclamações sobre o condomínio.</li>
        <li>Enviar o lembrete no dia da coleta, só para quem pediu.</li>
      </ul>
      <p>Não vendemos nem compartilhamos seus dados com empresas de propaganda.</p>

      <h2>Por quanto tempo guardamos</h2>
      <ul>
        <li>Respostas da pesquisa e mensagens: {privacidade.prazoRespostas}.</li>
        <li>Inscrição do lembrete: até você desligar o lembrete ou desinstalar o app.</li>
      </ul>

      <h2>Quem pode ver</h2>
      <p>
        Somente as pessoas da cooperativa autorizadas a usar o painel, com login e senha. Responsável pelos dados na
        cooperativa: {privacidade.responsavel}.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir para ver, corrigir ou apagar os dados que enviou. Fale com a cooperativa pelo e-mail{" "}
        <a href={`mailto:${contatos.email}`}>{contatos.email}</a> ou pelo WhatsApp {contatos.telefone}.
      </p>
    </article>
  );
}
