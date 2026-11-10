# Dados que a cooperativa ainda vai enviar

Tudo que aparece como **A PREENCHER** no app vem destes arquivos.
Cada arquivo tem, no topo, a explicação de como preencher.

| O que falta | Arquivo |
|---|---|
| Lista dos condomínios, dias da semana e horário (9h ou 14h) | `src/data/condominios.js` |
| Quais condomínios fazem o teste piloto | `src/data/condominios.js` (campo `piloto: true`) |
| Lista oficial do que recicla e do que não recicla | `src/data/materiais.js` |
| Prazo de guarda das respostas, responsável pelos dados e data da política | `src/data/privacidade.js` |
| Nome e e-mail de quem acessa o painel | Etapa 4 (não fica no código) |

Contatos (telefone, e-mail, Instagram) foram copiados do site: `src/data/contatos.js`.

Depois de editar, rode `npm.cmd test`: o teste avisa se algum condomínio ficou preenchido errado.
