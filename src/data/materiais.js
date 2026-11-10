// =====================================================================
// RECICLA OU NÃO RECICLA? — A PREENCHER
// =====================================================================
// A lista oficial da cooperativa ainda não foi enviada. Os itens abaixo
// são EXEMPLOS (exemplo: true) só para mostrar como a tela funciona.
//
// Como preencher cada material:
//   nome:      como o morador procuraria (ex.: "Caixa de pizza")
//   outros:    outros nomes/palavras que levam a este item (opcional)
//   recicla:   "sim", "nao" ou "depende"
//   categoria: "Papel", "Plástico", "Metal", "Vidro" ou "Outros"
//   preparo:   como preparar antes de separar (ou por que não recicla)
//   exemplo:   apague esta linha quando o dado for oficial
// =====================================================================

export const materiais = [
  {
    nome: "Garrafa PET",
    outros: ["garrafa de refrigerante", "garrafa plástica"],
    recicla: "sim",
    categoria: "Plástico",
    preparo: "A PREENCHER",
    exemplo: true,
  },
  {
    nome: "Lata de alumínio",
    outros: ["latinha", "lata de refrigerante", "lata de cerveja"],
    recicla: "sim",
    categoria: "Metal",
    preparo: "A PREENCHER",
    exemplo: true,
  },
  {
    nome: "Caixa de pizza",
    outros: ["papelão engordurado"],
    recicla: "depende",
    categoria: "Papel",
    preparo: "A PREENCHER",
    exemplo: true,
  },
  {
    nome: "Papel higiênico usado",
    outros: ["papel sujo", "guardanapo usado"],
    recicla: "nao",
    categoria: "Papel",
    preparo: "A PREENCHER",
    exemplo: true,
  },
];
