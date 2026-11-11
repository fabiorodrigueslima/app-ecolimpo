-- =====================================================================
-- FASE 1 — Limpeza automática (LGPD): apaga respostas com mais de 12 meses
-- =====================================================================
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro e
-- clique em "Run". Pode rodar de novo (refaz o agendamento).
--
-- Todo dia às 04h00 de Brasília (07:00 UTC), o banco apaga as respostas
-- (pesquisas e mensagens) com mais de 12 meses, como diz a política de
-- privacidade. Antes, baixe a planilha no painel se quiser guardar os números.
-- Para mudar o prazo: troque '12 months' aqui e na política
-- (src/data/privacidade.js) e rode de novo.
-- =====================================================================

create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'limpar-respostas-antigas';

select cron.schedule(
  'limpar-respostas-antigas',
  '0 7 * * *',
  $$ delete from public.respostas where criado_em < now() - interval '12 months'; $$
);

-- Confere: deve aparecer 1 linha com o agendamento.
select jobname, schedule, command from cron.job where jobname = 'limpar-respostas-antigas';
