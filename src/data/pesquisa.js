// =====================================================================
// TEXTOS DA PESQUISA DE SATISFAÇÃO
// =====================================================================
// Pode mudar os textos à vontade. NÃO mude os "id" (o banco usa).
// As listas de "motivos" são SUGESTÕES para a cooperativa revisar.
// =====================================================================

export const TEMAS_PESQUISA = [
  {
    id: "coleta",
    rotulo: "Coleta seletiva",
    pergunta: "Como você avalia a coleta seletiva no seu condomínio?",
    // SUGESTÃO — revisar com a cooperativa
    motivos: [
      { id: "nao_passou", rotulo: "Não passou no dia" },
      { id: "fora_horario", rotulo: "Passou fora do horário" },
      { id: "deixou_material", rotulo: "Deixou material para trás" },
      { id: "deixou_sujeira", rotulo: "Deixou sujeira no local" },
    ],
  },
  {
    id: "mobilizacao",
    rotulo: "Mobilização e orientação",
    pergunta: "Como você avalia as orientações que recebe sobre a separação dos recicláveis?",
    // SUGESTÃO — revisar com a cooperativa
    motivos: [
      { id: "pouca_orientacao", rotulo: "Recebo pouca orientação" },
      { id: "nao_claras", rotulo: "As orientações não são claras" },
      { id: "nao_sei_dia", rotulo: "Não sei o dia da coleta" },
      { id: "falta_divulgacao", rotulo: "Falta cartaz ou aviso no condomínio" },
    ],
  },
  {
    id: "atendimento",
    rotulo: "Atendimento",
    pergunta: "Como você avalia o atendimento da cooperativa quando precisou falar com ela?",
    // SUGESTÃO — revisar com a cooperativa
    motivos: [
      { id: "demorou", rotulo: "Demorou para responder" },
      { id: "nao_resolveu", rotulo: "Não resolveu meu problema" },
      { id: "dificil_contato", rotulo: "Difícil de entrar em contato" },
      { id: "mal_atendido", rotulo: "Não fui bem atendido(a)" },
    ],
  },
];

// Escala de satisfação: cada ponto tem nome (padrão de pesquisa).
export const ESCALA = [
  { valor: 1, rotulo: "Muito insatisfeito", emoji: "😞" },
  { valor: 2, rotulo: "Insatisfeito", emoji: "🙁" },
  { valor: 3, rotulo: "Neutro", emoji: "😐" },
  { valor: 4, rotulo: "Satisfeito", emoji: "🙂" },
  { valor: 5, rotulo: "Muito satisfeito", emoji: "😀" },
];

export const NAO_SEI = { valor: "nao_sei", rotulo: "Não sei / não utilizei" };

export const PERGUNTA_NPS = "De 0 a 10, quanto você recomendaria a coleta seletiva da Ecolimpo a um vizinho?";

export const PERGUNTA_HABITO = "Você separa os recicláveis em casa?";
export const HABITOS = [
  { id: "sempre", rotulo: "Sempre" },
  { id: "as_vezes", rotulo: "Às vezes" },
  { id: "ainda_nao", rotulo: "Ainda não" },
];

export const PERGUNTA_MELHORAR = "O que podemos melhorar?";
