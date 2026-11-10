// Envio das respostas para a cooperativa.
// ETAPA 1: ainda não existe banco de dados. A resposta é conferida, mas NÃO
// sai do celular. Na Etapa 2 esta função passa a salvar no Supabase.

export const ENVIO_LIGADO = false;

export async function enviarResposta(resposta) {
  void resposta;
  return { ok: true, teste: true };
}
