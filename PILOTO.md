# Roteiro do piloto

Passo a passo para testar o app com os 3 condomínios antes de levar para todos.
Cada item com 🔒 precisa da sua autorização antes de ser feito.

**Situação:** aguardando a aprovação da Diretoria (o projeto ainda será apresentado).
**Condomínios do piloto:** os 3 atendidos hoje — Condomínio Parque Ecológico do Mirante,
Condomínio Mônaco e Condomínio San Francisco II.
**Duração do piloto:** A PREENCHER (sugestão: 4 semanas)
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

- [ ] **Aprovação da Diretoria** (apresentar o projeto e o slide de lançamento).
- [x] Escolher os condomínios do piloto: os 3 condomínios (12/11/2026).
- [ ] Depois da aprovação: marcar **"Faz parte do teste piloto"** nos 3, no painel (é só uma etiqueta; não muda nada para o morador).
- [x] San Francisco II: coleta pela manhã, **10h** (pedido do síndico; SQL 015, 12/11/2026).
- [x] Parque do Mirante: segunda = coleta de **podas**, terça e quinta = recicláveis, às 14h (SQL 014, 12/11/2026).
- [x] Região corrigida no painel ("TORORÓ - JARDIM BOTÂNICO").
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
