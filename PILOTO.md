# Roteiro do piloto

Passo a passo para testar o app com 1 ou 2 condomínios antes de levar para todos.
Cada item com 🔒 precisa da sua autorização antes de ser feito.

**Condomínios do piloto:** A PREENCHER
**Duração do piloto:** A PREENCHER

---

## 1. Preparar (antes de imprimir qualquer cartaz)

1. 🔒 **Supabase:** criar a conta e o projeto (região São Paulo).
2. No Supabase, em "SQL Editor", rodar nesta ordem: `supabase/001_respostas.sql`, `002_lembretes.sql`, `004_painel.sql`.
3. No Supabase, em Authentication:
   - desligar "Allow new users to sign up";
   - em URL Configuration, colocar `https://app.cooperaecolimpo.com.br` e `https://app.cooperaecolimpo.com.br/painel`;
   - criar o login de cada pessoa da equipe e colocar o e-mail dela na tabela `equipe`.
4. 🔒 **Publicar o app:** criar o repositório no GitHub, o projeto na Vercel e o endereço `app.cooperaecolimpo.com.br`. Depois, colocar as variáveis do `.env.example` no painel da Vercel.
5. Rodar `supabase/003_agendamento.sql` (o despertador das 6h30), trocando `COLE_AQUI_O_SEGREDO` pelo `LEMBRETE_SEGREDO`.
6. No painel do app (`/painel` › Condomínios), cadastrar os condomínios do piloto com os dias e horários reais e marcar **"Faz parte do teste piloto"**.
7. Trocar a lista de exemplo do "Recicla ou não?" pela lista oficial (`src/data/materiais.js`) e preencher `src/data/privacidade.js`.

## 2. Testar com celulares de verdade (antes dos moradores)

Faça com **um Android e um iPhone**:

- [ ] Ler o QR Code do cartaz na tela: o app abre com o condomínio já marcado.
- [ ] Adicionar à tela inicial e abrir pelo ícone.
- [ ] Ligar o lembrete (no iPhone, só funciona aberto pela tela inicial).
- [ ] Enviar uma pesquisa e uma mensagem e conferir que aparecem no painel.
- [ ] No dia da coleta, conferir que o lembrete chegou às 6h30.
- [ ] Apagar no painel as respostas de teste.

## 3. Imprimir e colar o cartaz

1. No painel: Condomínios › botão **Cartaz** do condomínio.
2. Imprimir em **A4, colorido, tamanho real (100%)**. Não use "ajustar à página".
3. **Teste o QR Code impresso** com um celular antes de colar.
4. Colar só em lugares autorizados pelo síndico ou pela administração (ex.: hall, elevador, área das lixeiras).

## 4. Durante o piloto

- Toda semana, olhar no painel:
  - as respostas novas (filtro "Só as não lidas");
  - quantos moradores ligaram o lembrete (aba Condomínios).
- Responder dúvidas e reclamações pelo canal de sempre (WhatsApp da cooperativa).

## 5. No fim do piloto

- Baixar a planilha das respostas (painel › Respostas › Baixar planilha).
- Ver as médias das notas e o que os moradores pediram para melhorar.
- Decidir com a equipe se o app vai para os outros condomínios.
