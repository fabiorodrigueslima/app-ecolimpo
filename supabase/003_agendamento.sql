-- =====================================================================
-- ETAPA 3 — "Despertador" diário do lembrete (6h30 de Brasília)
-- =====================================================================
-- ATENÇÃO: rode este arquivo SÓ DEPOIS que o app estiver publicado na Vercel
-- (ele chama o endereço do app). Antes de rodar, troque (1 lugar só):
--   COLE_AQUI_O_SEGREDO -> o mesmo valor de LEMBRETE_SEGREDO configurado na Vercel
-- Se a senha não for trocada, o arquivo para com um aviso e não faz nada.
-- Pode rodar de novo quantas vezes precisar (troca a senha e refaz o agendamento).
--
-- O Supabase usa o horário UTC. 09:30 UTC = 06:30 em Brasília (sem horário de verão).
-- =====================================================================

-- 1. Guarda (ou troca) a senha no cofre do Supabase (Vault), fora do código.
do $$
declare
  segredo text := 'COLE_AQUI_O_SEGREDO';
  existente uuid;
begin
  if length(segredo) < 30 then
    raise exception 'Troque COLE_AQUI_O_SEGREDO pela senha LEMBRETE_SEGREDO (do .env.local / Vercel) antes de rodar.';
  end if;
  select id into existente from vault.secrets where name = 'lembrete_segredo';
  if existente is null then
    perform vault.create_secret(segredo, 'lembrete_segredo', 'Senha que o despertador usa para chamar o app');
  else
    perform vault.update_secret(existente, segredo);
  end if;
end $$;

-- 2. Liga o despertador (pg_cron) e o mensageiro (pg_net).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 3. Remove um agendamento antigo com o mesmo nome (se existir) e cria de novo.
select cron.unschedule(jobid) from cron.job where jobname = 'lembrete-coleta';

select cron.schedule(
  'lembrete-coleta',
  '30 9 * * *',
  $$
  select net.http_post(
    url := 'https://app.cooperaecolimpo.com.br/api/lembrete',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'lembrete_segredo')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Para PAUSAR o despertador (sem apagar nada):
--   select cron.unschedule('lembrete-coleta');
--
-- Para conferir depois:
--   select * from cron.job;                                               -- agendamento criado
--   select * from cron.job_run_details order by start_time desc limit 5;  -- últimas execuções
--   select * from net._http_response order by created desc limit 5;       -- resposta do app
