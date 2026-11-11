-- =====================================================================
-- CORREÇÃO — Busca de condomínio com acentos em MAIÚSCULAS
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo.
--
-- O erro: no banco do Supabase, lower() só passa para minúsculas as letras
-- SEM acento. "ECOLÓGICO" virava "ecolÓgico" e o "Ó" não era trocado, então
-- a busca por "ecológico" ou "mônaco" não achava nada.
-- O conserto: trocar também as letras acentuadas MAIÚSCULAS.
-- =====================================================================

create or replace function public.normalizar_texto(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(lower(coalesce(t, '')),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn');
$$;

revoke execute on function public.normalizar_texto(text) from public, anon, authenticated;

-- Confere: as 3 linhas devem mostrar o nome sem acento e em minúsculas.
select public.normalizar_texto('CONDOMÍNIO ECOLÓGICO') as teste
union all select public.normalizar_texto('MÔNACO')
union all select public.normalizar_texto('São Francisco');
