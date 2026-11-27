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
          <strong>O condomínio ou o bairro (casa / rua) que você escolheu</strong>, para mostrar o dia da sua coleta.
          Você pode trocar a qualquer momento.
        </li>
        <li>
          <strong>Os dados do seu condomínio</strong> (dias e horário da coleta), para o app abrir mesmo sem internet.
        </li>
        <li>
          <strong>O mês em que você respondeu a pesquisa</strong>, para cada celular responder uma vez por mês.
        </li>
        <li>
          <strong>Marcas da contagem de uso</strong> (“já contou esta visita” e “já contou a instalação”), para não contar
          a mesma coisa duas vezes.
        </li>
      </ul>
      <p>Essas informações não são enviadas para a cooperativa. Para apagar, limpe os dados do navegador ou do app.</p>

      <h2>O que é enviado para a cooperativa</h2>
      <ul>
        <li>
          <strong>Pesquisa de satisfação:</strong> o condomínio (obrigatório), as notas que você deu, a nota de
          recomendação (0 a 10), se você separa os recicláveis em casa, os motivos marcados quando a nota foi baixa e os
          textos que você escreveu.
        </li>
        <li>
          <strong>Mensagens</strong> (elogio, sugestão, reclamação ou dúvida): o condomínio, o tipo e o texto.
        </li>
        <li>
          Nas duas, <strong>só se você quiser</strong>: seu nome e apartamento.
        </li>
        <li>
          <strong>Lembrete da coleta (quando você ativar):</strong> um código técnico criado pelo seu navegador para
          receber o aviso e o condomínio escolhido. Não guardamos seu número de telefone.
        </li>
        <li>
          <strong>Contagem de uso (sem identificar ninguém):</strong> quando o app é aberto, instalado na tela inicial,
          aberto pelo QR Code, quando alguém toca nos botões de WhatsApp, Ouvidoria do SLU ou mapa do SLU, ou escolhe um
          bairro, o app soma +1 num contador do dia, junto com o condomínio ou o bairro escolhido. Não enviamos nome, telefone, localização nem código do celular: só dá para saber{" "}
          <strong>quantas vezes</strong>, nunca <strong>quem</strong>.
        </li>
      </ul>
      <p>
        Nunca pedimos CPF, telefone, e-mail ou endereço completo. Por favor, não escreva esses dados nos textos.
      </p>

      <h2>Para que usamos</h2>
      <ul>
        <li>Melhorar a coleta seletiva e a orientação aos moradores.</li>
        <li>Entender dúvidas e reclamações sobre a coleta no condomínio.</li>
        <li>Enviar o lembrete no dia da coleta e avisos da cooperativa (como ações de mobilização no condomínio), só para quem pediu.</li>
        <li>Saber quanto o app é usado em cada condomínio, pela contagem de uso (só números).</li>
      </ul>
      <p>Não vendemos nem compartilhamos seus dados com empresas de propaganda.</p>

      <h2>Onde os dados ficam</h2>
      <ul>
        <li>
          As respostas ficam num banco de dados do serviço <strong>Supabase</strong>, em servidor no Brasil (São Paulo).
        </li>
        <li>
          O app é hospedado pela <strong>Vercel</strong>. O envio das respostas passa por um servidor dela em São Paulo,
          que só repassa os dados ao banco e não guarda o que você escreveu.
        </li>
        <li>
          Os avisos do lembrete passam pelo serviço de notificações do seu celular (Google, Apple, Mozilla ou Microsoft),
          que só entrega a mensagem.
        </li>
        <li>
          Para proteger o app contra robôs, a pesquisa, as mensagens e o lembrete passam por uma verificação de segurança
          da <strong>Cloudflare (Turnstile)</strong>. Ela usa informações técnicas do navegador e o endereço de internet
          (IP) só para confirmar que é uma pessoa, e não guarda o que você escreveu.
        </li>
      </ul>

      <h2>Por quanto tempo guardamos</h2>
      <ul>
        <li>
          Respostas da pesquisa e mensagens: <strong>{privacidade.prazoRespostas}</strong>. Depois disso, são apagadas
          automaticamente.
        </li>
        <li>Inscrição do lembrete: até você desligar o lembrete ou desinstalar o app.</li>
        <li>Contagem de uso (só números por dia): 2 anos. Depois disso, é apagada automaticamente.</li>
      </ul>

      <h2>Quem pode ver</h2>
      <p>
        Somente as pessoas da cooperativa autorizadas a usar o painel, com login e senha. Responsável pelos dados:{" "}
        <strong>{privacidade.responsavel}</strong>.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir para ver, corrigir ou apagar os dados que enviou. Fale com a cooperativa pelo e-mail{" "}
        <a href={`mailto:${contatos.email}`}>{contatos.email}</a> ou pelo WhatsApp {contatos.telefone}.
      </p>
    </article>
  );
}
