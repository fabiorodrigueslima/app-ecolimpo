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

export function linkWhatsapp(mensagem) {
  return `https://wa.me/${contatos.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
