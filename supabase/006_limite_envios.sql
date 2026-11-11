-- =====================================================================
-- FASE 1 — Limite contra envio em massa (spam)
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Rode DEPOIS do 001, 002, 004 e 005. Pode rodar de novo.
--
-- Antes de guardar cada resposta, o banco conta quantas chegaram há pouco.
-- Se passar do limite, recusa com a mensagem "limite_de_envios".
-- Para mudar um limite, troque o número aqui e rode o arquivo de novo.
-- =====================================================================

-- ---------- Respostas (pesquisa e mensagens) ----------
create or replace function public.limitar_respostas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_app_10min  int;
  condominio_10min int;
  condominio_dia   int;
begin
  select count(*) into total_app_10min
    from public.respostas where criado_em > now() - interval '10 minutes';
  if total_app_10min >= 300 then
    raise exception 'limite_de_envios: muitos envios no app agora' using errcode = 'P0001';
  end if;

  select count(*) into condominio_10min
    from public.respostas
    where condominio_id = new.condominio_id and criado_em > now() - interval '10 minutes';
  if condominio_10min >= 60 then
    raise exception 'limite_de_envios: muitos envios deste condomínio agora' using errcode = 'P0001';
  end if;

  select count(*) into condominio_dia
    from public.respostas
    where condominio_id = new.condominio_id and criado_em > now() - interval '1 day';
  if condominio_dia >= 500 then
    raise exception 'limite_de_envios: muitos envios deste condomínio hoje' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.limitar_respostas() from public, anon, authenticated;

drop trigger if exists limitar_respostas on public.respostas;
create trigger limitar_respostas
  before insert on public.respostas
  for each row execute function public.limitar_respostas();

-- ---------- Inscrições do lembrete ----------
-- Mesma função de antes (002), agora com limite para inscrições NOVAS.
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
begin
  if not exists (select 1 from public.inscricoes_lembrete where endpoint = p_endpoint)
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

revoke execute on function public.salvar_inscricao(text, text, text, text) from public, anon, authenticated;
grant execute on function public.salvar_inscricao(text, text, text, text) to anon;
