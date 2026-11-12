// =====================================================================
// CONDOMÍNIOS ATENDIDOS — A PREENCHER
// =====================================================================
// Os condomínios abaixo são EXEMPLOS (exemplo: true). Eles aparecem no app
// com o aviso "Dados de exemplo — A PREENCHER".
//
// Como preencher cada condomínio:
//   id:      apelido curto, sem espaço nem acento (ex.: "jardins-do-lago")
//   nome:    nome do condomínio como o morador conhece
//   regiao:  bairro ou região (opcional)
//   dias:    dias da coleta, por número: 0 = domingo, 1 = segunda,
//            2 = terça, 3 = quarta, 4 = quinta, 5 = sexta, 6 = sábado
//   diasPoda: dias da coleta de podas (opcional; mesmo jeito dos "dias")
//   horario: "09:00" ou "10:00" (manhã) ou "14:00" (tarde)
//   piloto:  true se o condomínio faz parte do teste piloto
//   exemplo: apague esta linha quando o dado for real
// =====================================================================

export const condominios = [
  {
    id: "exemplo-manha",
    nome: "Condomínio Exemplo 1 (A PREENCHER)",
    regiao: "A PREENCHER",
    dias: [2],
    horario: "09:00",
    piloto: false,
    exemplo: true,
  },
  {
    id: "exemplo-tarde",
    nome: "Condomínio Exemplo 2 (A PREENCHER)",
    regiao: "A PREENCHER",
    dias: [2, 4],
    diasPoda: [1],
    horario: "14:00",
    piloto: false,
    exemplo: true,
  },
];
