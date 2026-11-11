// =====================================================================
// GUIA DE SEPARAÇÃO — o que a cooperativa recicla e o que não recicla
// =====================================================================
// Itens enviados pela cooperativa (referência de 11/11/2026).
// Para mudar: edite o "nome". O "icone" precisa ser um destes:
//   papel, papelao, plastico, vidro, metal, isopor, longaVida,
//   alimentos, cafe, fralda, papelEngordurado, banheiro, tecido
// =====================================================================

export const reciclaveis = {
  titulo: "Recicláveis",
  explicacao: "Separe para a coleta seletiva",
  itens: [
    { nome: "Papel", icone: "papel" },
    { nome: "Papelão", icone: "papelao" },
    { nome: "Plástico", icone: "plastico" },
    { nome: "Vidro", icone: "vidro" },
    { nome: "Metal", icone: "metal" },
    { nome: "EPS (Isopor)", icone: "isopor" },
    { nome: "Embalagem longa vida", icone: "longaVida" },
  ],
};

export const naoReciclaveis = {
  titulo: "Orgânicos e rejeitos",
  explicacao: "Não coloque junto com os recicláveis",
  itens: [
    { nome: "Restos de alimentos", icone: "alimentos" },
    { nome: "Borra de café", icone: "cafe" },
    { nome: "Fralda descartável", icone: "fralda" },
    { nome: "Papéis engordurados", icone: "papelEngordurado" },
    { nome: "Lixo de banheiro", icone: "banheiro" },
    { nome: "Tecidos rasgados", icone: "tecido" },
  ],
};

export const ICONES_DOS_ITENS = [
  "papel",
  "papelao",
  "plastico",
  "vidro",
  "metal",
  "isopor",
  "longaVida",
  "alimentos",
  "cafe",
  "fralda",
  "papelEngordurado",
  "banheiro",
  "tecido",
];
