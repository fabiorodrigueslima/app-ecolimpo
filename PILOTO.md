# Roteiro do piloto

Passo a passo para testar o app com 1 ou 2 condomínios antes de levar para todos.
Cada item com 🔒 precisa da sua autorização antes de ser feito.

**Condomínios do piloto:** A PREENCHER
**Duração do piloto:** A PREENCHER
**Endereço do app:** https://app.cooperaecolimpo.com.br

---

## 1. Preparar — ✅ concluído em 11/11/2026

- [x] Supabase criado (São Paulo) e todos os arquivos SQL rodados (001 a 013).
- [x] Login do painel com verificação em 2 etapas (app autenticador).
- [x] App publicado na Vercel, no endereço oficial, com https.
- [x] Despertador das 6h30 ligado.
- [x] Lembrete testado num celular Android: a notificação chegou.
- [x] Segurança: checklist de 20 itens (19 aprovados), anti-robô ativo, backup no painel.
- [x] Condomínios cadastrados com os nomes oficiais; lista privada (busca pelo nome ou QR Code).

## 2. Antes de imprimir

- [ ] Escolher os condomínios do piloto e marcar **"Faz parte do teste piloto"** no painel.
- [ ] Conferir **dias e horário** de cada condomínio do piloto (San Francisco II: 9h ou 14h?).
- [ ] Conferir a **região** ("TORÓRÓ" → "Tororó"?).
- [ ] Testar num **iPhone**: adicionar à tela inicial, ligar o lembrete, receber o aviso.
- [ ] (Opcional) Frase do catador, com autorização (`src/data/reciclagemMundo.js`).
- [ ] (Opcional) Revisar as opções de "O que aconteceu?" da pesquisa (`src/data/pesquisa.js`).

## 3. Imprimir e colar o cartaz

1. No painel: **Condomínios** › botão **Cartaz** do condomínio.
2. Imprimir em **A4, colorido, tamanho real (100%)**. Não use "ajustar à página".
3. **Teste o QR Code impresso** com um celular: deve abrir o app com o condomínio já marcado.
4. Colar só em lugares autorizados pelo síndico ou pela administração (ex.: hall, elevador, área das lixeiras).

## 4. Durante o piloto (toda semana)

- Painel › **Respostas**: ver as novas (filtro "Só as não lidas"), as médias e o NPS.
- Painel › **Condomínios**: quantos moradores ligaram o lembrete; o quadro do "Último lembrete" verde.
- Painel › **Backup**: baixar a cópia uma vez por mês.
- Responder dúvidas e reclamações pelo WhatsApp da cooperativa.

## 5. No fim do piloto

- Baixar a planilha das respostas (painel › Respostas › Baixar planilha).
- Ver as médias, o NPS, os motivos das notas baixas e o hábito de separação.
- Decidir com a equipe se o app vai para os outros condomínios.
