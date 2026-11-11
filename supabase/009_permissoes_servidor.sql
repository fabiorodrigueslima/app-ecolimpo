-- =====================================================================
-- FASE 2 — Permissões do servidor do lembrete (chave secreta / service_role)
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo.
--
-- Por quê: o projeto foi criado com "Expor automaticamente novas tabelas"
-- DESLIGADO (mais seguro). Então nem a chave secreta ganha acesso sozinha.
-- Aqui damos ao servidor do lembrete SÓ o que ele usa.
-- =====================================================================

grant usage on schema public to service_role;

-- Ler os condomínios ativos (para saber quem tem coleta hoje).
grant select on public.condominios to service_role;

-- Ler as inscrições e apagar as de celulares que desligaram o aviso.
grant select, delete on public.inscricoes_lembrete to service_role;

-- Anotar cada execução do despertador (o painel mostra o último registro).
grant insert on public.envios_lembrete to service_role;
grant usage on all sequences in schema public to service_role;

-- Confere: cada linha deve mostrar "true".
select 'ler condomínios' as permissao, has_table_privilege('service_role', 'public.condominios', 'select') as ok
union all select 'ler inscrições', has_table_privilege('service_role', 'public.inscricoes_lembrete', 'select')
union all select 'apagar inscrições', has_table_privilege('service_role', 'public.inscricoes_lembrete', 'delete')
union all select 'anotar envios', has_table_privilege('service_role', 'public.envios_lembrete', 'insert');
