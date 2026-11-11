-- =====================================================================
-- MELHORIA — Lista de condomínios privada (sigilo comercial e segurança)
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo.
--
-- Antes: qualquer pessoa conseguia ler a lista de todos os condomínios.
-- Agora: o app (morador) NÃO lê a tabela. Ele só pode:
--   * buscar_condominios('texto'): no mínimo 4 letras; devolve no máximo 3
--     condomínios ATIVOS cujo nome contém o texto (sem ligar para acentos).
--   * condominio_por_id('id'): usado pelo QR Code do cartaz e para atualizar
--     o condomínio já escolhido no celular.
-- A equipe (painel) continua vendo todos. O servidor do lembrete também.
-- =====================================================================

-- Tira o acesso aberto à tabela.
drop policy if exists "todos veem condominios ativos" on public.condominios;
revoke select on public.condominios from anon;

-- Deixa o nome "sem acento e em minúsculas" para comparar.
create or replace function public.normalizar_texto(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(lower(coalesce(t, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn');
$$;

-- Busca pelo nome (para quem não veio pelo QR Code).
create or replace function public.buscar_condominios(p_texto text)
returns table (id text, nome text, regiao text, dias smallint[], horario text, piloto boolean)
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
    select c.id, c.nome, c.regiao, c.dias, c.horario, c.piloto
    from public.condominios c
    where c.ativo
      and public.normalizar_texto(c.nome) like '%' || termo || '%'
    order by c.nome
    limit 3;
end;
$$;

-- Um condomínio pelo apelido (id), se estiver ativo.
create or replace function public.condominio_por_id(p_id text)
returns table (id text, nome text, regiao text, dias smallint[], horario text, piloto boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.nome, c.regiao, c.dias, c.horario, c.piloto
  from public.condominios c
  where c.id = p_id and c.ativo;
$$;

revoke execute on function public.normalizar_texto(text) from public, anon, authenticated;
revoke execute on function public.buscar_condominios(text) from public;
revoke execute on function public.condominio_por_id(text) from public;
grant execute on function public.buscar_condominios(text) to anon, authenticated;
grant execute on function public.condominio_por_id(text) to anon, authenticated;

-- Confere: a 1ª linha deve ser "false" (app não lê mais a tabela) e as outras "true".
select 'app lê a tabela inteira?' as conferencia, has_table_privilege('anon', 'public.condominios', 'select') as resultado
union all select 'app pode buscar pelo nome', has_function_privilege('anon', 'public.buscar_condominios(text)', 'execute')
union all select 'app pode abrir pelo QR Code', has_function_privilege('anon', 'public.condominio_por_id(text)', 'execute');
