-- =====================================================================
-- FASE 1 — Registro dos envios do lembrete (para o painel avisar falhas)
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo.
--
-- Cada vez que o despertador das 6h30 roda, o servidor anota aqui o que fez.
-- Só a equipe (painel) consegue ler. Registros com mais de 90 dias são
-- apagados sozinhos.
-- =====================================================================

create table if not exists public.envios_lembrete (
  id            bigint generated always as identity primary key,
  executado_em  timestamptz not null default now(),
  condominios   text[] not null default '{}',
  inscricoes    int not null default 0,
  enviados      int not null default 0,
  removidos     int not null default 0,
  falhas        int not null default 0,
  erro          text check (char_length(erro) <= 300)
);

create index if not exists envios_lembrete_data_idx on public.envios_lembrete (executado_em desc);

alter table public.envios_lembrete enable row level security;
revoke all on public.envios_lembrete from anon, authenticated;
grant select on public.envios_lembrete to authenticated;

drop policy if exists "equipe le envios do lembrete" on public.envios_lembrete;
create policy "equipe le envios do lembrete" on public.envios_lembrete
  for select to authenticated using (public.eh_equipe());
-- Quem grava é só o servidor do lembrete (chave secreta), que passa por cima do RLS.

-- Limpeza: apaga registros com mais de 90 dias (todo dia às 04h05 de Brasília).
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'limpar-registros-lembrete';
select cron.schedule(
  'limpar-registros-lembrete',
  '5 7 * * *',
  $$ delete from public.envios_lembrete where executado_em < now() - interval '90 days'; $$
);

-- Confere: deve aparecer 1 linha.
select jobname, schedule from cron.job where jobname = 'limpar-registros-lembrete';
