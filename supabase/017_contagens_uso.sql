-- =====================================================================
-- CONTADORES DE USO DO APP — só números por dia, sem dados pessoais
-- =====================================================================
-- ATENÇÃO, ORDEM CERTA:
--   1. Rodar ESTE arquivo no SQL Editor do Supabase.
--   2. Só depois enviar a versão nova do app (git push).
--   (Se o app chegar antes, nada quebra: ele só não conta até o SQL ser rodado.)
--
-- O que muda:
--   * Tabela nova "contagens": uma linha por DIA + TIPO + LUGAR, com o TOTAL.
--     Ex.: 2026-11-27 | abertura | condominio-san-francisco-ii | 4
--   * NÃO guarda nome, telefone, e-mail, IP, aparelho nem código do celular.
--     Não dá para saber QUEM abriu, só QUANTAS vezes.
--   * O app soma +1 chamando a função "contar". Ninguém de fora lê a tabela.
--   * Só a equipe (login + código do autenticador) vê os números no painel.
--   * Linhas com mais de 2 anos são apagadas sozinhas.
--
-- Tipos aceitos:
--   abertura       app aberto (1 vez por visita)
--   instalacao     app instalado na tela inicial
--   qr             entrou pelo QR Code / link do condomínio
--   whatsapp       tocou no botão de WhatsApp da cooperativa
--   ouvidoria      tocou em "Ligar para a Ouvidoria SLU 162" (casas)
--   mapa_slu       tocou em "Ver no mapa oficial do SLU" (casas)
--   fora_da_lista  escolheu "Meu bairro não está na lista" (casas)
--   escolha_bairro escolheu um bairro (casas)
-- Lugar: '' (sem local escolhido), o id do condomínio, ou 'bairro:<id>'.
-- =====================================================================

create table if not exists public.contagens (
  dia    date   not null,
  tipo   text   not null check (tipo in ('abertura', 'instalacao', 'qr', 'whatsapp', 'ouvidoria',
                                          'mapa_slu', 'fora_da_lista', 'escolha_bairro')),
  local  text   not null default '' check (local ~ '^(|[a-z0-9-]{1,60}|bairro:[a-z0-9-]{1,60})$'),
  total  bigint not null default 0 check (total >= 0),
  primary key (dia, tipo, local)
);
comment on table public.contagens is 'Contadores de uso do app por dia, tipo e lugar. Sem dados pessoais.';

-- ---------- Quem pode o quê ----------
alter table public.contagens enable row level security;
revoke all on public.contagens from anon, authenticated;
grant select on public.contagens to authenticated;

drop policy if exists "equipe le contagens" on public.contagens;
create policy "equipe le contagens" on public.contagens
  for select to authenticated using (public.eh_equipe());

-- ---------- O app soma +1 ----------
-- Regras de proteção (para ninguém encher a tabela de lixo):
--   * tipo e lugar precisam estar no formato certo;
--   * condomínio precisa existir no cadastro (senão conta como '' = sem local);
--   * no máximo 60 bairros diferentes por dia e 1 milhão por linha.
create or replace function public.contar(p_tipo text, p_local text default '')
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_dia   date := (now() at time zone 'America/Sao_Paulo')::date;
  v_local text := lower(coalesce(p_local, ''));
begin
  if p_tipo not in ('abertura', 'instalacao', 'qr', 'whatsapp', 'ouvidoria',
                    'mapa_slu', 'fora_da_lista', 'escolha_bairro') then
    return;
  end if;
  if v_local !~ '^(|[a-z0-9-]{1,60}|bairro:[a-z0-9-]{1,60})$' then
    v_local := '';
  end if;
  -- Condomínio que não existe vira "sem local".
  if v_local <> '' and v_local not like 'bairro:%'
     and not exists (select 1 from public.condominios c where c.id = v_local) then
    v_local := '';
  end if;
  -- Bairros vêm do arquivo do app: limita quantos nomes diferentes entram por dia.
  if v_local like 'bairro:%'
     and not exists (select 1 from public.contagens k where k.dia = v_dia and k.local = v_local)
     and (select count(distinct k.local) from public.contagens k
          where k.dia = v_dia and k.local like 'bairro:%') >= 60 then
    return;
  end if;

  insert into public.contagens as k (dia, tipo, local, total)
  values (v_dia, p_tipo, v_local, 1)
  on conflict (dia, tipo, local)
  do update set total = k.total + 1
  where k.total < 1000000;
end;
$$;

revoke execute on function public.contar(text, text) from public;
grant execute on function public.contar(text, text) to anon, authenticated;

-- ---------- Limpeza: apaga contagens com mais de 2 anos ----------
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'limpar-contagens-antigas';
select cron.schedule(
  'limpar-contagens-antigas',
  '20 7 * * *',
  $$ delete from public.contagens where dia < (now() at time zone 'America/Sao_Paulo')::date - 730; $$
);

-- Confere (o Supabase mostra só este resultado). As 4 linhas devem ser "true".
select 'tabela contagens criada' as conferencia, to_regclass('public.contagens') is not null as ok
union all select 'app NÃO lê a tabela (deve ser true)', not has_table_privilege('anon', 'public.contagens', 'select')
union all select 'app NÃO grava direto (deve ser true)', not has_table_privilege('anon', 'public.contagens', 'insert')
union all select 'app pode somar +1 pela função', has_function_privilege('anon', 'public.contar(text, text)', 'execute');
