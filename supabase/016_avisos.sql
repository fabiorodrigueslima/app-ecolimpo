-- =====================================================================
-- AVISOS DA COOPERATIVA — ex.: ação de mobilização no condomínio
-- =====================================================================
-- ATENÇÃO, ORDEM CERTA:
--   1. Rodar ESTE arquivo no SQL Editor do Supabase.
--   2. Só depois enviar a versão nova do app (git push).
--
-- O que muda:
--   * Tabela nova "avisos": a equipe publica pelo painel (aba Avisos) um aviso
--     para um condomínio, com a data da ação.
--   * O app do morador mostra o aviso na tela Início até o fim do dia da ação.
--   * Quem ligou o lembrete recebe o aviso no celular às 6h30 do dia da ação
--     (se "notificar" estiver marcado).
--   * Avisos com mais de 30 dias são apagados sozinhos.
--   * Nenhum dado de morador: só o texto da cooperativa.
-- =====================================================================

create table if not exists public.avisos (
  id             bigint generated always as identity primary key,
  condominio_id  text not null references public.condominios (id) on update cascade on delete cascade,
  data           date not null,
  texto          text not null check (char_length(texto) between 10 and 400),
  notificar      boolean not null default true,
  criado_em      timestamptz not null default now()
);
comment on table public.avisos is 'Avisos da cooperativa para os moradores de um condomínio (ex.: mobilização).';

create index if not exists avisos_condominio_data_idx on public.avisos (condominio_id, data);

-- ---------- Quem pode o quê ----------
alter table public.avisos enable row level security;
revoke all on public.avisos from anon, authenticated;
grant select, insert, delete on public.avisos to authenticated;
grant select on public.avisos to service_role; -- o servidor do lembrete lê os avisos do dia

drop policy if exists "equipe le avisos" on public.avisos;
create policy "equipe le avisos" on public.avisos
  for select to authenticated using (public.eh_equipe());

drop policy if exists "equipe publica avisos" on public.avisos;
create policy "equipe publica avisos" on public.avisos
  for insert to authenticated with check (public.eh_equipe());

drop policy if exists "equipe apaga avisos" on public.avisos;
create policy "equipe apaga avisos" on public.avisos
  for delete to authenticated using (public.eh_equipe());
-- Sem UPDATE: para corrigir um aviso, apague e publique de novo.

-- ---------- O app do morador lê só os avisos do condomínio dele ----------
create or replace function public.avisos_do_condominio(p_id text)
returns table (id bigint, data date, texto text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.data, a.texto
  from public.avisos a
  join public.condominios c on c.id = a.condominio_id
  where a.condominio_id = p_id
    and c.ativo
    and a.data >= (now() at time zone 'America/Sao_Paulo')::date
  order by a.data, a.id
  limit 3;
$$;

revoke execute on function public.avisos_do_condominio(text) from public;
grant execute on function public.avisos_do_condominio(text) to anon, authenticated;

-- ---------- Limpeza: apaga avisos com mais de 30 dias ----------
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'limpar-avisos-antigos';
select cron.schedule(
  'limpar-avisos-antigos',
  '10 7 * * *',
  $$ delete from public.avisos where data < (now() at time zone 'America/Sao_Paulo')::date - 30; $$
);

-- Confere (o Supabase mostra só este resultado). As 4 linhas devem ser "true".
select 'tabela avisos criada' as conferencia, to_regclass('public.avisos') is not null as ok
union all select 'app NÃO lê a tabela direto (deve ser true)', not has_table_privilege('anon', 'public.avisos', 'select')
union all select 'app lê os avisos do condomínio', has_function_privilege('anon', 'public.avisos_do_condominio(text)', 'execute')
union all select 'servidor lê os avisos do dia', has_table_privilege('service_role', 'public.avisos', 'select');
