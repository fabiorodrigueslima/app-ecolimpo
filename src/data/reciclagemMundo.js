// =====================================================================
// "VOCÊ SABIA?" — quanto cada país recicla (tela Recicla ou não recicla?)
// =====================================================================
// Só use números com fonte. Para atualizar (ex.: saiu um Panorama novo),
// troque "porcentagem", "ano" e "fonte" do país.
//
// Medida: parte do lixo das cidades (resíduos sólidos urbanos) que vai
// para reciclagem. Cada país mede de um jeito um pouco diferente.
// =====================================================================

export const paises = [
  {
    nome: "Alemanha",
    porcentagem: 69,
    ano: 2024,
    fonte: "Eurostat",
    link: "https://ec.europa.eu/eurostat/databrowser/view/cei_wm011/default/table",
  },
  {
    nome: "Áustria",
    porcentagem: 60.7,
    ano: 2024,
    fonte: "Eurostat",
    link: "https://ec.europa.eu/eurostat/databrowser/view/cei_wm011/default/table",
  },
  {
    nome: "Coreia do Sul",
    porcentagem: 59,
    ano: 2023,
    fonte: "Ministério do Meio Ambiente da Coreia (via Korea Herald)",
    link: "https://www.koreaherald.com/article/10599798",
  },
  {
    nome: "Brasil",
    porcentagem: 8.7,
    ano: 2024,
    fonte: "ABREMA – Panorama dos Resíduos Sólidos no Brasil 2025",
    link: "https://www.abrema.org.br/2025/12/09/producao-de-residuos-cresce-em-2024-destinacao-adequada-melhora/",
    destaque: true,
  },
];

export const notaMetodologia =
  "Cada país mede a reciclagem de um jeito um pouco diferente. Os números mostram a diferença entre eles, não uma comparação exata.";

// Frase de um catador ou catadora da cooperativa — A PREENCHER.
// autor: só o primeiro nome (ou deixe vazio), com autorização da pessoa.
export const depoimento = {
  texto: "A PREENCHER",
  autor: "A PREENCHER",
  funcao: "catador(a) da Cooperativa Ecolimpo",
};

// Enquanto a frase do catador não chega, aparece esta, assinada pela Cooperativa.
export const mensagemDaCooperativa = {
  texto: "O que você separa em casa vira trabalho e renda para quem vive da reciclagem. Seu gesto chega até nós.",
  autor: "Cooperativa Ecolimpo",
};
