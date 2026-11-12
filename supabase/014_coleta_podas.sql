-- =====================================================================
-- COLETA DE PODAS — dia da poda em cada condomínio (só quem tiver)
-- =====================================================================
-- ATENÇÃO, ORDEM CERTA:
--   1. Rodar ESTE arquivo no SQL Editor do Supabase.
--   2. Só depois enviar a versão nova do app (git push).
--   A versão antiga do app continua funcionando com este SQL; a versão nova
--   precisa dele (o painel grava "dias_poda" e o lembrete lê "dias_poda").
--
-- O que muda:
--   * Coluna nova "dias_poda" (mesmos números de "dias": 0 = domingo ... 6 = sábado).
--     Vazia = o condomínio não tem coleta de podas (as regras não aparecem no app).
--   * O app do morador passa a receber "dias_poda" (funções do SQL 010 refeitas).
--   * Parque do Mirante: segunda-feira passa a ser PODA (não recicláveis).
--     Recicláveis: terça e quinta. Podas: segunda. Horário continua 14h.
-- =====================================================================

alter table public.condominios
  add column if not exists dias_poda smallint[] not null default '{}'
  check (dias_poda <@ array[0,1,2,3,4,5,6]::smallint[]);
comment on column public.condominios.dias_poda is 'Dias da coleta de podas: 0 = domingo, 1 = segunda ... 6 = sábado';

-- A equipe (painel) pode cadastrar e editar o dia da poda.
grant insert (dias_poda) on public.condominios to authenticated;
grant update (dias_poda) on public.condominios to authenticated;

-- ---------- Funções do app do morador (agora com dias_poda) ----------
-- O formato da resposta mudou, então é preciso apagar e criar de novo.
drop function if exists public.buscar_condominios(text);
drop function if exists public.condominio_por_id(text);

create function public.buscar_condominios(p_texto text)
returns table (id text, nome text, regiao text, dias smallint[], dias_poda smallint[], horario text, piloto boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  termo text := btrim(public.normalizar_texto(p_texto));
begin
  if char_length(termo) < 4 then
    return; -- texto curto demais: não devolve nada
  end if;
  -- Trata % e _ como letras comuns (não como "curinga").
  termo := replace(replace(replace(termo, '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select c.id, c.nome, c.regiao, c.dias, c.dias_poda, c.horario, c.piloto
    from public.condominios c
    where c.ativo
      and public.normalizar_texto(c.nome) like '%' || termo || '%'
    order by c.nome
    limit 3;
end;
$$;

create function public.condominio_por_id(p_id text)
returns table (id text, nome text, regiao text, dias smallint[], dias_poda smallint[], horario text, piloto boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.nome, c.regiao, c.dias, c.dias_poda, c.horario, c.piloto
  from public.condominios c
  where c.id = p_id and c.ativo;
$$;

revoke execute on function public.buscar_condominios(text) from public;
revoke execute on function public.condominio_por_id(text) from public;
grant execute on function public.buscar_condominios(text) to anon, authenticated;
grant execute on function public.condominio_por_id(text) to anon, authenticated;

-- ---------- Parque do Mirante: segunda = podas ----------
update public.condominios
   set dias = '{2,4}', dias_poda = '{1}', atualizado_em = now()
 where id = 'condominio-ecologico-parque-do-mirante';

-- Confere (o Supabase mostra só este último resultado):
--   Parque do Mirante: reciclaveis {2,4}, podas {1}. Os outros: podas {}.
--   Coluna "app_le": true em todas as linhas (o app consegue ler pelo QR Code).
select c.nome, c.dias::text as reciclaveis, c.dias_poda::text as podas, c.horario,
       has_function_privilege('anon', 'public.condominio_por_id(text)', 'execute') as app_le
  from public.condominios c order by c.nome;
