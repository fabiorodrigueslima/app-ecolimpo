-- =====================================================================
-- ETAPA 3 — "Despertador" diário do lembrete (6h30 de Brasília)
-- =====================================================================
-- ATENÇÃO: rode este arquivo SÓ DEPOIS que o app estiver publicado na Vercel
-- (ele chama o endereço do app). Antes de rodar, troque:
--   COLE_AQUI_O_SEGREDO -> o mesmo valor de LEMBRETE_SEGREDO configurado na Vercel
--
-- O Supabase usa o horário UTC. 09:30 UTC = 06:30 em Brasília (sem horário de verão).
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Guarda o segredo no cofre do Supabase (Vault), fora do código.
select vault.create_secret(
    'COLE_AQUI_O_SEGREDO',
    'lembrete_segredo',
    'Senha que o despertador usa para chamar o app'
  );
-- Remove um agendamento antigo com o mesmo nome (se existir) e cria de novo.
select cron.unschedule(jobid)
from cron.job
where jobname = 'lembrete-coleta';
select cron.schedule(
    'lembrete-coleta',
    '30 9 * * *',
    $$
    select net.http_post(
        url := 'https://app.cooperaecolimpo.com.br/api/lembrete',
        headers := jsonb_build_object(
          'Content-Type',
          'application/json',
          'Authorization',
          'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'lembrete_segredo'
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
$$
);
-- Para conferir depois:
--   select * from cron.job;                                   -- agendamento criado
--   select * from cron.job_run_details order by start_time desc limit 5;  -- últimas execuções
--   select * from net._http_response order by created desc limit 5;       -- resposta do app