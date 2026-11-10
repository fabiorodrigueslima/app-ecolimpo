-- =====================================================================
-- ETAPA 2 — Tabela das respostas dos moradores (pesquisa e mensagens)
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo sem problema (não apaga respostas).
--
-- Proteção (RLS):
--   * Moradores (o app, sem login) só podem ENVIAR respostas.
--   * Ninguém consegue ler, alterar ou apagar respostas pelo app.
--   * A leitura será liberada só para a equipe do painel na Etapa 4.
-- =====================================================================
create table if not exists public.respostas (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  tipo text not null check (
    tipo in (
      'pesquisa',
      'elogio',
      'sugestao',
      'reclamacao',
      'duvida'
    )
  ),
  condominio_id text not null check (condominio_id ~ '^[a-z0-9-]{1,60}$'),
  nome text check (char_length(nome) <= 80),
  apartamento text check (char_length(apartamento) <= 20),
  nota_coleta smallint check (
    nota_coleta between 1 and 5
  ),
  nota_mobilizacao smallint check (
    nota_mobilizacao between 1 and 5
  ),
  nota_atendimento smallint check (
    nota_atendimento between 1 and 5
  ),
  texto text check (char_length(texto) <= 1000),
  lida boolean not null default false,
  -- usado pelo painel (Etapa 4)
  -- Pesquisa precisa das 3 notas; mensagem não tem notas.
  constraint pesquisa_tem_notas check (
    (
      tipo = 'pesquisa'
      and nota_coleta is not null
      and nota_mobilizacao is not null
      and nota_atendimento is not null
    )
    or (
      tipo <> 'pesquisa'
      and nota_coleta is null
      and nota_mobilizacao is null
      and nota_atendimento is null
    )
  ),
  -- Mensagem precisa de texto (pelo menos 3 letras).
  constraint mensagem_tem_texto check (
    tipo = 'pesquisa'
    or (
      texto is not null
      and char_length(btrim(texto)) >= 3
    )
  )
);
comment on table public.respostas is 'Pesquisa de satisfação e mensagens enviadas pelos moradores pelo app. Nome e apartamento são opcionais.';
create index if not exists respostas_criado_em_idx on public.respostas (criado_em desc);
create index if not exists respostas_condominio_idx on public.respostas (condominio_id);
-- Liga a proteção por linha (RLS).
alter table public.respostas enable row level security;
-- Tira todas as permissões e devolve só o necessário.
revoke all on public.respostas
from anon,
  authenticated;
-- O app pode inserir apenas estas colunas (não pode escolher id, data nem "lida").
grant insert (
    tipo,
    condominio_id,
    nome,
    apartamento,
    nota_coleta,
    nota_mobilizacao,
    nota_atendimento,
    texto
  ) on public.respostas to anon;
drop policy if exists "moradores enviam respostas" on public.respostas;
create policy "moradores enviam respostas" on public.respostas for
insert to anon with check (true);
-- Não existe política de SELECT, UPDATE ou DELETE: ninguém lê pelo app.