// =====================================================================
// COLETA SELETIVA NAS CASAS / RUAS — circuitos do SLU
// =====================================================================
// SÓ INFORMATIVO: quem define a rota é o SLU (Serviço de Limpeza Urbana do DF),
// não a cooperativa. O app nunca promete coleta onde o caminhão não passa.
//
// Fonte: mapa oficial do SLU e panfleto do SLU. Prestador de todos: Cooperativa
// Ecolimpo (Coleta Seletiva Inclusiva). Não tem coleta sábado, domingo nem à noite.
//
// COMO MUDAR SE O SLU MUDAR ALGO:
//   * Dia ou turno de um circuito  -> mude em CIRCUITOS (dia: 1=segunda ... 5=sexta;
//     turno: "manha" ou "tarde").
//   * Bairro/área novo ou que saiu  -> mude em AREAS (cada área aponta para o código
//     do circuito).
//   * Horário dos turnos            -> mude em TURNOS.
//   * Depois de mudar, atualize CONFERIDO_EM e rode "npm.cmd test" (os testes
//     conferem se tudo continua certo).
// =====================================================================

// Data em que a cooperativa conferiu estes dados no mapa do SLU ("AAAA-MM-DD").
// A PREENCHER: enquanto estiver vazio, o app não mostra a data.
export const CONFERIDO_EM = "";

export const SLU = {
  nome: "SLU",
  ouvidoria: "162",
  ouvidoriaLink: "tel:162",
  mapa: "https://sigportal.slu.df.gov.br/arcgis/apps/webappviewer/index.html?id=6854430f522546f990c08850191ff824",
};

// Turnos da coleta seletiva do SLU.
export const TURNOS = {
  manha: { nome: "manhã", inicio: "08:00", fim: "12:00" },
  tarde: { nome: "tarde", inicio: "13:00", fim: "18:00" },
};

// Circuitos (rotas) do SLU feitos pela Cooperativa Ecolimpo.
// dia: 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
export const CIRCUITOS = {
  403201: [
    { dia: 1, turno: "manha" },
    { dia: 4, turno: "manha" },
  ],
  403202: [{ dia: 2, turno: "manha" }],
  403203: [{ dia: 5, turno: "tarde" }],
  403204: [
    { dia: 3, turno: "manha" },
    { dia: 5, turno: "manha" },
  ],
  403205: [
    { dia: 2, turno: "tarde" },
    { dia: 4, turno: "tarde" },
  ],
  403206: [
    { dia: 1, turno: "tarde" },
    { dia: 3, turno: "tarde" },
  ],
};

// Áreas que o morador escolhe na lista.
//   circuitos: códigos dos circuitos que passam na área.
//   partes:    quando o bairro é dividido (quadra/rua), o morador escolhe a parte.
//              Quem não está em nenhuma parte vai para "Meu bairro não está na lista".
export const AREAS = [
  // ---- Jardins Mangueiral e Jardim Botânico ----
  { id: "jardins-mangueiral", nome: "Jardins Mangueiral", grupo: "Jardins Mangueiral e Jardim Botânico", circuitos: ["403201"] },
  { id: "jardim-botanico-iii", nome: "Jardim Botânico III", grupo: "Jardins Mangueiral e Jardim Botânico", circuitos: ["403201"] },
  { id: "av-marginal-df-001", nome: "Av. Marginal DF-001", grupo: "Jardins Mangueiral e Jardim Botânico", circuitos: ["403201"] },

  // ---- São Sebastião ----
  { id: "sao-jose", nome: "Bairro São José", grupo: "São Sebastião", circuitos: ["403202", "403203"] },
  { id: "sao-francisco", nome: "Bairro São Francisco", grupo: "São Sebastião", circuitos: ["403202", "403203"] },
  { id: "centro", nome: "Centro", grupo: "São Sebastião", circuitos: ["403202", "403203"] },
  {
    id: "vila-nova",
    nome: "Bairro Vila Nova",
    grupo: "São Sebastião",
    pergunta: "Em qual rua você mora?",
    partes: [{ id: "vila-nova-ruas-12-54", nome: "Ruas 12 até 54", circuitos: ["403204"] }],
  },
  { id: "bela-vista", nome: "Bairro Bela Vista", grupo: "São Sebastião", circuitos: ["403204"] },
  { id: "residencial-do-bosque", nome: "Residencial do Bosque", grupo: "São Sebastião", circuitos: ["403204"] },
  { id: "avenida-sao-sebastiao", nome: "Avenida São Sebastião", grupo: "São Sebastião", circuitos: ["403205"] },
  {
    id: "residencial-oeste",
    nome: "Residencial Oeste",
    grupo: "São Sebastião",
    pergunta: "Em qual quadra você mora?",
    partes: [
      // Texto igual ao do SLU (falta confirmar se as ruas ficam dentro das quadras 101 a 104).
      { id: "residencial-oeste-101-104", nome: "Quadras 101 até 104 (ruas 12, 13, 14, 15A e 16)", circuitos: ["403206"] },
      { id: "residencial-oeste-201-206", nome: "Quadras 201 até 206", circuitos: ["403205"] },
      { id: "residencial-oeste-301-307", nome: "Quadras 301 até 307", circuitos: ["403205"] },
    ],
  },
  { id: "avenida-comercial", nome: "Avenida Comercial", grupo: "São Sebastião", circuitos: ["403206"] },
  {
    id: "sao-bartolomeu",
    nome: "Bairro São Bartolomeu",
    grupo: "São Sebastião",
    pergunta: "Em qual quadra você mora?",
    partes: [{ id: "sao-bartolomeu-quadras-1-2", nome: "Quadras 1 e 2", circuitos: ["403206"] }],
  },
  { id: "tradicional", nome: "Bairro Tradicional", grupo: "São Sebastião", circuitos: ["403206"] },
  { id: "morro-azul", nome: "Morro Azul", grupo: "São Sebastião", circuitos: ["403206"] },
];
