// Contatos copiados do site oficial (siteEcolimpo/src/data/site.js).
// Se mudarem no site, atualize aqui também.

export const contatos = {
  nome: "Cooperativa Ecolimpo",
  nomeOficial: "Cooperativa de Trabalho de Catadores Ecolimpo",
  site: "https://www.cooperaecolimpo.com.br",
  telefone: "(61) 98237-2013",
  telefoneLink: "tel:+5561982372013",
  whatsapp: "5561982372013",
  email: "cooperativaecolimpodf@gmail.com",
  endereco: "ADE PRO-DF CJ.01 Lote 9, Bonsucesso, São Sebastião - DF",
  instagram: "https://www.instagram.com/cooperativa.ecolimpo/",
  instagramNome: "@cooperativa.ecolimpo",
};

// Texto pronto do WhatsApp do morador: diz que veio do app e de qual condomínio,
// para a cooperativa não precisar perguntar. O texto só vai para o WhatsApp do
// morador (ele decide se envia); o app não guarda nada.
// local: o condomínio ({ nome }) ou a casa ({ tipo: "casa", escolha | foraDaLista }).
export function mensagemDoMorador(local, assunto = "") {
  const partes = ["Olá! Vim pelo app da Ecolimpo."];
  if (local?.tipo === "casa") {
    partes.push(
      local.foraDaLista
        ? "Moro em casa, numa área que não está na lista do app."
        : `Moro em casa: ${local.escolha.nomeCompleto} (${local.escolha.grupo ?? ""}).`.replace(" ()", ""),
    );
  } else if (local?.nome) partes.push(`Sou do ${local.nome}.`);
  if (assunto) partes.push(assunto);
  return partes.join(" ");
}

export function linkWhatsapp(mensagem) {
  return `https://wa.me/${contatos.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
