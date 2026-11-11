-- =====================================================================
-- MELHORIA — Pesquisa de satisfação completa
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Rode DEPOIS do 001, 002 e 004. Pode rodar de novo.
-- Não apaga nenhuma resposta: só acrescenta perguntas novas.
--
-- O que muda:
--   * nps        nota de 0 a 10 ("recomendaria a um vizinho?")
--   * habito     separa em casa? sempre / as_vezes / ainda_nao
--   * motivos    motivos marcados quando a nota foi baixa (ex.: "coleta:nao_passou")
--   * detalhes   texto livre do "O que aconteceu?", por tema
--   * As notas dos temas podem ficar vazias ("Não sei / não utilizei").
-- =====================================================================

alter table public.respostas add column if not exists nps smallint check (nps between 0 and 10);
alter table public.respostas add column if not exists habito text check (habito in ('sempre', 'as_vezes', 'ainda_nao'));
alter table public.respostas add column if not exists motivos text[] check (
  motivos is null
  or (
    cardinality(motivos) between 1 and 15
    and array_to_string(motivos, ',') ~ '^[a-z_]{1,30}:[a-z_]{1,30}(,[a-z_]{1,30}:[a-z_]{1,30})*$'
  )
);
alter table public.respostas add column if not exists detalhes jsonb check (
  detalhes is null
  or (jsonb_typeof(detalhes) = 'object' and char_length(detalhes::text) <= 1200)
);

-- Regra nova das notas: a pesquisa precisa de pelo menos uma nota OU da
-- recomendação (NPS); a mensagem não tem nada disso.
alter table public.respostas drop constraint if exists pesquisa_tem_notas;
alter table public.respostas drop constraint if exists pesquisa_tem_respostas;
alter table public.respostas add constraint pesquisa_tem_respostas check (
  (
    tipo = 'pesquisa'
    and (nota_coleta is not null or nota_mobilizacao is not null or nota_atendimento is not null or nps is not null)
  )
  or (
    tipo <> 'pesquisa'
    and nota_coleta is null and nota_mobilizacao is null and nota_atendimento is null
    and nps is null and habito is null and motivos is null and detalhes is null
  )
);

-- O app (moradores) pode enviar também as colunas novas.
grant insert (nps, habito, motivos, detalhes) on public.respostas to anon;
