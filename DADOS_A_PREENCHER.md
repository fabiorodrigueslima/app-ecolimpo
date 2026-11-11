# Dados que a cooperativa ainda vai enviar

Tudo que aparece como **A PREENCHER** no app vem destes lugares.

| O que falta | Onde fica |
|---|---|
| Condomínios, dias da semana, horário (9h ou 14h) e piloto | **Com o banco ligado:** cadastrar no painel (`/painel` › Condomínios). **Sem banco (teste):** `src/data/condominios.js` |
| Frase de um catador ou catadora (e o primeiro nome, com autorização) | `src/data/reciclagemMundo.js` (`depoimento`) |
| Quais condomínios fazem o piloto e por quanto tempo | Painel (marcar "Faz parte do teste piloto") e `PILOTO.md` |
| Nome e e-mail de quem acessa o painel | Supabase: login em Authentication › Users, e o e-mail na tabela `equipe` (final de `supabase/004_painel.sql`) |

Contatos (telefone, e-mail, Instagram) foram copiados do site: `src/data/contatos.js`.

Depois de editar algum arquivo, rode `npm.cmd test`: o teste avisa se algo ficou preenchido errado.
