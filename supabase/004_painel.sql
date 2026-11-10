-- =====================================================================
-- ETAPA 4 — Painel da cooperativa: equipe, condomínios e permissões
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Rode DEPOIS do 001 e do 002. Pode rodar de novo.
--
-- Depois de rodar:
--   1. Authentication > Sign In / Providers: DESLIGUE "Allow new users to sign up".
--   2. Authentication > Users > "Add user": crie o login de cada pessoa da equipe.
--   3. Coloque o e-mail de cada pessoa na lista "equipe" (final deste arquivo).
--
-- Quem pode o quê:
--   * Moradores (app, sem login): veem os condomínios ATIVOS; enviam respostas;
--     ligam/desligam o lembrete.
--   * Equipe (login + e-mail na tabela "equipe"): vê e filtra respostas, marca
--     como lida, apaga (pedido do morador/LGPD), cadastra e edita condomínios,
--     vê quantos moradores ligaram o lembrete.
--   * Qualquer outro login: não vê nada.
-- =====================================================================

-- ---------- Equipe (quem pode usar o painel) ----------
create table if not exists public.equipe (
  email      text primary key check (email = lower(email) and email like '%@%'),
  nome       text not null check (char_length(nome) between 1 and 80),
  criado_em  timestamptz not null default now()
);
alter table public.equipe enable row level security;
revoke all on public.equipe from anon, authenticated;

-- Diz se quem está logado faz parte da equipe.
create or replace function public.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.equipe
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function public.eh_equipe() from public, anon;
grant execute on function public.eh_equipe() to authenticated;

-- ---------- Condomínios ----------
create table if not exists public.condominios (
  id             text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  nome           text not null check (char_length(nome) between 2 and 100),
  regiao         text check (char_length(regiao) <= 100),
  dias           smallint[] not null default '{}'
                 check (dias <@ array[0,1,2,3,4,5,6]::smallint[]),
  horario        text not null check (horario in ('09:00', '14:00')),
  piloto         boolean not null default false,
  ativo          boolean not null default true,
  atualizado_em  timestamptz not null default now()
);
comment on column public.condominios.dias is '0 = domingo, 1 = segunda ... 6 = sábado';

alter table public.condominios enable row level security;
revoke all on public.condominios from anon, authenticated;
grant select on public.condominios to anon, authenticated;
grant insert (id, nome, regiao, dias, horario, piloto, ativo) on public.condominios to authenticated;
grant update (nome, regiao, dias, horario, piloto, ativo, atualizado_em) on public.condominios to authenticated;

drop policy if exists "todos veem condominios ativos" on public.condominios;
create policy "todos veem condominios ativos" on public.condominios
  for select to anon, authenticated using (ativo);

drop policy if exists "equipe ve todos os condominios" on public.condominios;
create policy "equipe ve todos os condominios" on public.condominios
  for select to authenticated using (public.eh_equipe());

drop policy if exists "equipe cadastra condominios" on public.condominios;
create policy "equipe cadastra condominios" on public.condominios
  for insert to authenticated with check (public.eh_equipe());

drop policy if exists "equipe edita condominios" on public.condominios;
create policy "equipe edita condominios" on public.condominios
  for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());
-- Sem DELETE: para tirar um condomínio do app, marque "ativo = não".

-- ---------- Respostas: leitura e edição só pela equipe ----------
grant select, delete on public.respostas to authenticated;
grant update (lida) on public.respostas to authenticated;

drop policy if exists "equipe le respostas" on public.respostas;
create policy "equipe le respostas" on public.respostas
  for select to authenticated using (public.eh_equipe());

drop policy if exists "equipe marca respostas" on public.respostas;
create policy "equipe marca respostas" on public.respostas
  for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists "equipe apaga respostas" on public.respostas;
create policy "equipe apaga respostas" on public.respostas
  for delete to authenticated using (public.eh_equipe());

-- ---------- Ligações com a tabela de condomínios ----------
-- "not valid": só confere as respostas e inscrições NOVAS.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'respostas_condominio_fk') then
    alter table public.respostas
      add constraint respostas_condominio_fk foreign key (condominio_id)
      references public.condominios (id) on update cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inscricoes_condominio_fk') then
    alter table public.inscricoes_lembrete
      add constraint inscricoes_condominio_fk foreign key (condominio_id)
      references public.condominios (id) on update cascade on delete cascade not valid;
  end if;
end $$;

-- ---------- Quantos moradores ligaram o lembrete (por condomínio) ----------
create or replace function public.contar_inscricoes()
returns table (condominio_id text, total bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.eh_equipe() then
    raise exception 'acesso negado';
  end if;
  return query
    select i.condominio_id, count(*)::bigint
    from public.inscricoes_lembrete i
    group by i.condominio_id;
end;
$$;
revoke execute on function public.contar_inscricoes() from public, anon;
grant execute on function public.contar_inscricoes() to authenticated;

-- ---------- Pessoas da equipe — A PREENCHER ----------
-- Troque pelos dados reais (e-mail em letras minúsculas) e rode só esta parte:
-- insert into public.equipe (email, nome) values
--   ('email-da-pessoa@exemplo.com', 'Nome da pessoa')
-- on conflict (email) do update set nome = excluded.nome;
