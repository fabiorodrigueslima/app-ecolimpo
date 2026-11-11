// Regras dos formulários "Fale com a cooperativa".
// Só o condomínio é obrigatório para identificar; nome e apartamento são opcionais.

export const TEMAS_PESQUISA = [
  { id: "coleta", rotulo: "Coleta seletiva" },
  { id: "mobilizacao", rotulo: "Mobilização e orientação" },
  { id: "atendimento", rotulo: "Atendimento" },
];

export const TIPOS_MENSAGEM = [
  { id: "elogio", rotulo: "Elogio" },
  { id: "sugestao", rotulo: "Sugestão" },
  { id: "reclamacao", rotulo: "Reclamação" },
  { id: "duvida", rotulo: "Dúvida" },
];

// Tipo que vem no endereço (ex.: /fale/mensagem?tipo=duvida). Só aceita tipos válidos.
export function tipoDoLink(busca) {
  const tipo = new URLSearchParams(busca ?? "").get("tipo");
  return TIPOS_MENSAGEM.some((t) => t.id === tipo) ? tipo : "";
}

export const LIMITES ={ nome: 80, apartamento: 20, texto: 1000 };

const limpar = (v) => {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
};

function conferirIdentificacao(dados, idsCondominios, erros) {
  if (!dados.condominioId || !idsCondominios.includes(dados.condominioId))
    erros.condominioId = "Escolha o seu condomínio.";
  if ((limpar(dados.nome) ?? "").length > LIMITES.nome)
    erros.nome = `O nome pode ter até ${LIMITES.nome} letras.`;
  if ((limpar(dados.apartamento) ?? "").length > LIMITES.apartamento)
    erros.apartamento = `O apartamento pode ter até ${LIMITES.apartamento} caracteres.`;
}

export function validarPesquisa(dados, idsCondominios) {
  const erros = {};
  conferirIdentificacao(dados, idsCondominios, erros);
  for (const tema of TEMAS_PESQUISA) {
    const nota = dados.notas?.[tema.id];
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) erros[`nota_${tema.id}`] = "Escolha uma nota de 1 a 5.";
  }
  if ((limpar(dados.melhorar) ?? "").length > LIMITES.texto)
    erros.melhorar = `O texto pode ter até ${LIMITES.texto} letras.`;
  return { ok: Object.keys(erros).length === 0, erros };
}

export function validarMensagem(dados, idsCondominios) {
  const erros = {};
  conferirIdentificacao(dados, idsCondominios, erros);
  if (!TIPOS_MENSAGEM.some((t) => t.id === dados.tipo)) erros.tipo = "Escolha o tipo da mensagem.";
  const texto = limpar(dados.texto) ?? "";
  if (texto.length < 3) erros.texto = "Escreva a sua mensagem.";
  else if (texto.length > LIMITES.texto) erros.texto = `A mensagem pode ter até ${LIMITES.texto} letras.`;
  return { ok: Object.keys(erros).length === 0, erros };
}

// Monta a resposta no formato que será guardado no banco (Etapa 2).
export function montarPesquisa(dados) {
  return {
    tipo: "pesquisa",
    condominio_id: dados.condominioId,
    nome: limpar(dados.nome),
    apartamento: limpar(dados.apartamento),
    nota_coleta: dados.notas.coleta,
    nota_mobilizacao: dados.notas.mobilizacao,
    nota_atendimento: dados.notas.atendimento,
    texto: limpar(dados.melhorar),
  };
}

export function montarMensagem(dados) {
  return {
    tipo: dados.tipo,
    condominio_id: dados.condominioId,
    nome: limpar(dados.nome),
    apartamento: limpar(dados.apartamento),
    texto: limpar(dados.texto),
  };
}
