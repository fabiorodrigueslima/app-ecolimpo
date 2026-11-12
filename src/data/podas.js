// =====================================================================
// COLETA DE PODAS — regras mostradas só nos condomínios que têm dia de poda
// =====================================================================
// Texto copiado do panfleto da cooperativa para o Parque do Mirante (12/11/2026).
// Para mudar: edite os textos abaixo. O "icone" precisa ser um destes:
//   galho, folha, alimentos, banheiro, animal
// =====================================================================

export const regrasPoda = [
  { icone: "galho", texto: "Galhos, podas e troncos de no máximo 1,5 m de comprimento." },
  {
    icone: "folha",
    texto: "As podas de grama e folhas devem estar ensacadas, pois serão recolhidos apenas 10 sacos por residência.",
  },
  {
    icone: "alimentos",
    texto: "Não coloque restos de alimentos, terra, areia ou fezes de animais junto às podas de grama e folhas ensacadas.",
    alerta: true,
  },
];

export const podasColetamos = {
  titulo: "Podas",
  explicacao: "Coletamos",
  itens: [
    { nome: "Podas de grama / folhas", icone: "folha" },
    { nome: "Galhos / troncos", icone: "galho" },
  ],
};

export const podasNaoColetamos = {
  titulo: "Rejeitos",
  explicacao: "Não coletamos",
  itens: [
    { nome: "Resto de alimentos e frutas podres", icone: "alimentos" },
    { nome: "Lixo de banheiro", icone: "banheiro" },
    { nome: "Fezes e cadáveres de animais", icone: "animal" },
  ],
};
