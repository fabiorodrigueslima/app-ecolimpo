-- =====================================================================
-- SEGURANÇA — Anti-robô: o banco só aceita envios pelo nosso servidor
-- =====================================================================
-- ATENÇÃO, ORDEM CERTA:
--   1. Criar o Turnstile na Cloudflare e colocar as chaves na Vercel.
--   2. Publicar a versão do app com o anti-robô (envios via api/enviar).
--   3. Rodar este arquivo LOGO EM SEGUIDA: ele dá ao servidor a permissão de
--      gravar. Sem ele, a versão nova não consegue gravar respostas.
--
-- O que muda:
--   * O app (morador) NÃO grava mais direto em "respostas". Quem grava é o
--     servidor (api/enviar.js), depois de conferir o anti-robô.
--   * Inscrição NOVA no lembrete: só pelo servidor. O app ainda pode trocar o
--     condomínio de uma inscrição que já existe e desligar o lembrete.
-- =====================================================================

-- ---------- Respostas: só o servidor grava ----------
drop policy if exists "moradores enviam respostas" on public.respostas;
revoke insert on public.respostas from anon;

grant insert (tipo, condominio_id, nome, apartamento, nota_coleta, nota_mobilizacao, nota_atendimento,
              texto, nps, habito, motivos, detalhes)
  on public.respostas to service_role;

-- ---------- Inscrições do lembrete ----------
create or replace function public.salvar_inscricao(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_condominio_id text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ja_existe boolean := exists (select 1 from public.inscricoes_lembrete where endpoint = p_endpoint);
begin
  -- Inscrição nova só pelo servidor (que conferiu o anti-robô).
  if not ja_existe and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'precisa_verificacao: inscrição nova só pelo servidor' using errcode = 'P0001';
  end if;

  if not ja_existe
     and (select count(*) from public.inscricoes_lembrete where criado_em > now() - interval '10 minutes') >= 100 then
    raise exception 'limite_de_envios: muitas inscrições agora' using errcode = 'P0001';
  end if;

  insert into public.inscricoes_lembrete (endpoint, p256dh, auth, condominio_id)
  values (p_endpoint, p_p256dh, p_auth, p_condominio_id)
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh,
        auth = excluded.auth,
        condominio_id = excluded.condominio_id,
        atualizado_em = now();
end;
$$;

revoke execute on function public.salvar_inscricao(text, text, text, text) from public, authenticated;
grant execute on function public.salvar_inscricao(text, text, text, text) to anon, service_role;

-- Confere: a 1ª linha deve ser "false" e as outras "true".
select 'app grava resposta direto?' as conferencia, has_table_privilege('anon', 'public.respostas', 'insert')
     or has_column_privilege('anon', 'public.respostas', 'texto', 'insert') as resultado
union all select 'servidor grava resposta', has_column_privilege('service_role', 'public.respostas', 'texto', 'insert')
union all select 'servidor cria inscrição', has_function_privilege('service_role', 'public.salvar_inscricao(text, text, text, text)', 'execute');
