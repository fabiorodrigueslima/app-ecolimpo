# Dados que a cooperativa ainda vai enviar

Tudo que aparece como **A PREENCHER** no app vem destes lugares.

| O que falta | Onde fica |
|---|---|
| Condomínios, dias da semana, horário (9h ou 14h) e piloto | **Com o banco ligado:** cadastrar no painel (`/painel` › Condomínios). **Sem banco (teste):** `src/data/condominios.js` |
| Lista oficial do que recicla e do que não recicla | `src/data/materiais.js` |
| Prazo de guarda das respostas, responsável pelos dados e data da política | `src/data/privacidade.js` |
| Nome e e-mail de quem acessa o painel | Supabase: login em Authentication › Users, e o e-mail na tabela `equipe` (final de `supabase/004_painel.sql`) |

Contatos (telefone, e-mail, Instagram) foram copiados do site: `src/data/contatos.js`.

Depois de editar algum arquivo, rode `npm.cmd test`: o teste avisa se algo ficou preenchido errado.
