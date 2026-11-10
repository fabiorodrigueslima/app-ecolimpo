-- =====================================================================
-- ETAPA 3 — Inscrições do lembrete no celular (Web Push)
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Rode DEPOIS do 001_respostas.sql. Pode rodar de novo.
--
-- O que é guardado: o "endereço de entrega" que o navegador do celular cria
-- para receber notificações (não é telefone nem e-mail) e o condomínio.
--
-- Proteção:
--   * O app NÃO acessa a tabela diretamente (RLS ligada, sem permissões).
--   * O app só pode chamar duas funções: salvar_inscricao e cancelar_inscricao.
--   * Só o servidor do lembrete (com a chave secreta) lê a lista.
-- =====================================================================
create table if not exists public.inscricoes_lembrete (
  endpoint text primary key check (
    char_length(endpoint) <= 1000
    and endpoint like 'https://%'
  ),
  p256dh text not null check (
    char_length(p256dh) between 20 and 200
  ),
  auth text not null check (
    char_length(auth) between 8 and 100
  ),
  condominio_id text not null check (condominio_id ~ '^[a-z0-9-]{1,60}$'),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.inscricoes_lembrete is 'Moradores que ligaram o lembrete da coleta. Apagado quando o morador desliga ou o celular deixa de aceitar.';
create index if not exists inscricoes_condominio_idx on public.inscricoes_lembrete (condominio_id);
alter table public.inscricoes_lembrete enable row level security;
revoke all on public.inscricoes_lembrete
from anon,
  authenticated;
-- Liga (ou troca o condomínio de) uma inscrição.
create or replace function public.salvar_inscricao(
    p_endpoint text,
    p_p256dh text,
    p_auth text,
    p_condominio_id text
  ) returns void language sql security definer
set search_path = '' as $$
insert into public.inscricoes_lembrete (endpoint, p256dh, auth, condominio_id)
values (p_endpoint, p_p256dh, p_auth, p_condominio_id) on conflict (endpoint) do
update
set p256dh = excluded.p256dh,
  auth = excluded.auth,
  condominio_id = excluded.condominio_id,
  atualizado_em = now();
$$;
-- Desliga o lembrete (só quem tem o endereço de entrega consegue apagar).
create or replace function public.cancelar_inscricao(p_endpoint text) returns void language sql security definer
set search_path = '' as $$
delete from public.inscricoes_lembrete
where endpoint = p_endpoint;
$$;
revoke execute on function public.salvar_inscricao(text, text, text, text)
from public,
  anon,
  authenticated;
revoke execute on function public.cancelar_inscricao(text)
from public,
  anon,
  authenticated;
grant execute on function public.salvar_inscricao(text, text, text, text) to anon;
grant execute on function public.cancelar_inscricao(text) to anon;