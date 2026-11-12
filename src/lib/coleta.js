// Regras da coleta: qual condomínio tem coleta em qual dia, próxima coleta
// e o texto do lembrete. Tudo calculado no horário de Brasília.

export const FUSO = "America/Sao_Paulo";
export const HORARIOS_VALIDOS = ["09:00", "10:00", "14:00"]; // mudar junto com o SQL 015
export const NOMES_DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const SIGLAS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Dia, mês, ano e dia da semana de uma data, no horário de Brasília.
export function dataEmBrasilia(data = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(data);
  const pegar = (tipo) => partes.find((p) => p.type === tipo).value;
  return {
    ano: Number(pegar("year")),
    mes: Number(pegar("month")),
    dia: Number(pegar("day")),
    diaSemana: SIGLAS[pegar("weekday")],
  };
}

export function diaDaSemanaEmBrasilia(data = new Date()) {
  return dataEmBrasilia(data).diaSemana;
}

// "09:00" -> "9h", "14:00" -> "14h", "14:30" -> "14h30"
export function formatarHorario(horario) {
  const [h, m] = String(horario).split(":");
  const hora = String(Number(h));
  return m && m !== "00" ? `${hora}h${m}` : `${hora}h`;
}

export function periodoDoHorario(horario) {
  return Number(String(horario).split(":")[0]) < 12 ? "manhã" : "tarde";
}

// [1, 4] -> "segunda-feira e quinta-feira"
export function descreverDias(dias) {
  const nomes = [...dias].sort((a, b) => a - b).map((d) => NOMES_DIAS[d]);
  if (nomes.length === 0) return "A PREENCHER";
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

// Coleta seletiva (recicláveis) no dia.
export function temColetaNoDia(condominio, data = new Date()) {
  return (condominio.dias ?? []).includes(diaDaSemanaEmBrasilia(data));
}

// Dias da coleta de podas (só alguns condomínios têm; os outros ficam com []).
export function diasDePoda(condominio) {
  return condominio.diasPoda ?? [];
}

export function temPodaNoDia(condominio, data = new Date()) {
  return diasDePoda(condominio).includes(diaDaSemanaEmBrasilia(data));
}

// Quais coletas o condomínio tem no dia: ["reciclaveis"], ["podas"], os dois ou nenhum.
export function coletasDoDia(condominio, data = new Date()) {
  return [
    ...(temColetaNoDia(condominio, data) ? ["reciclaveis"] : []),
    ...(temPodaNoDia(condominio, data) ? ["podas"] : []),
  ];
}

// Lista dos condomínios que têm alguma coleta no dia (usada pelo lembrete diário).
export function condominiosComColetaNoDia(lista, data = new Date()) {
  return lista.filter((c) => coletasDoDia(c, data).length > 0);
}

export function textoLembrete(horario) {
  return `Não esqueça de colocar os recicláveis para fora hoje! A coleta seletiva passa às ${formatarHorario(horario)}.`;
}

export function textoLembretePoda(horario) {
  return `Hoje tem coleta de podas! Galhos de até 1,5 m e grama/folhas ensacadas (até 10 sacos). A coleta passa às ${formatarHorario(horario)}.`;
}

export function textoLembreteDosDois(horario) {
  return `Hoje tem coleta seletiva e de podas! Coloque os recicláveis e as podas para fora. A coleta passa às ${formatarHorario(horario)}.`;
}

function somarDias({ ano, mes, dia }, n) {
  const d = new Date(Date.UTC(ano, mes - 1, dia + n));
  return {
    ano: d.getUTCFullYear(),
    mes: d.getUTCMonth() + 1,
    dia: d.getUTCDate(),
    diaSemana: d.getUTCDay(),
  };
}

// Próximas coletas a partir de hoje (hoje conta, se for dia de coleta).
function proximasDatas(dias, data, quantidade) {
  if (!dias.length) return [];
  const hoje = dataEmBrasilia(data);
  const resultado = [];
  for (let n = 0; resultado.length < quantidade && n < 366; n++) {
    const d = somarDias(hoje, n);
    if (dias.includes(d.diaSemana)) resultado.push({ ...d, diasAte: n });
  }
  return resultado;
}

// Coleta seletiva (recicláveis).
export function proximasColetas(condominio, data = new Date(), quantidade = 4) {
  return proximasDatas(condominio.dias, data, quantidade);
}

export function proximaColeta(condominio, data = new Date()) {
  return proximasColetas(condominio, data, 1)[0] ?? null;
}

// Coleta de podas.
export function proximaPoda(condominio, data = new Date()) {
  return proximasDatas(diasDePoda(condominio), data, 1)[0] ?? null;
}

// Próximas datas das duas coletas juntas, em ordem, com o tipo de cada uma.
// Ex.: [{ dia: 17, ..., tipos: ["podas"] }, { dia: 18, ..., tipos: ["reciclaveis"] }]
export function proximasColetasComTipo(condominio, data = new Date(), quantidade = 4) {
  const reciclaveis = new Set(condominio.dias);
  const podas = new Set(diasDePoda(condominio));
  const todos = [...new Set([...reciclaveis, ...podas])];
  return proximasDatas(todos, data, quantidade).map((d) => ({
    ...d,
    tipos: [...(reciclaveis.has(d.diaSemana) ? ["reciclaveis"] : []), ...(podas.has(d.diaSemana) ? ["podas"] : [])],
  }));
}

// "Hoje", "Amanhã" ou "Quinta-feira, 13/11"
export function rotuloDaColeta(coleta) {
  if (coleta.diasAte === 0) return "Hoje";
  if (coleta.diasAte === 1) return "Amanhã";
  const nome = NOMES_DIAS[coleta.diaSemana];
  const dd = String(coleta.dia).padStart(2, "0");
  const mm = String(coleta.mes).padStart(2, "0");
  return `${nome[0].toUpperCase()}${nome.slice(1)}, ${dd}/${mm}`;
}

// Confere se a lista de condomínios foi preenchida do jeito certo.
export function conferirCondominios(lista) {
  const erros = [];
  const ids = new Set();
  lista.forEach((c, i) => {
    const onde = `Condomínio ${i + 1} (${c.nome ?? "sem nome"})`;
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) erros.push(`${onde}: "id" deve ter só letras minúsculas, números e hífen.`);
    if (ids.has(c.id)) erros.push(`${onde}: "id" repetido.`);
    ids.add(c.id);
    if (!c.nome) erros.push(`${onde}: falta o nome.`);
    if (!Array.isArray(c.dias) || c.dias.some((d) => !Number.isInteger(d) || d < 0 || d > 6))
      erros.push(`${onde}: "dias" deve ter números de 0 (domingo) a 6 (sábado).`);
    if (c.diasPoda !== undefined && (!Array.isArray(c.diasPoda) || c.diasPoda.some((d) => !Number.isInteger(d) || d < 0 || d > 6)))
      erros.push(`${onde}: "diasPoda" deve ter números de 0 (domingo) a 6 (sábado).`);
    if (!HORARIOS_VALIDOS.includes(c.horario)) erros.push(`${onde}: "horario" deve ser "09:00", "10:00" ou "14:00".`);
  });
  return erros;
}
