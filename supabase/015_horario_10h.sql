-- =====================================================================
-- HORÁRIO 10h — nova opção de horário da coleta
-- =====================================================================
-- ATENÇÃO, ORDEM CERTA:
--   1. Rodar ESTE arquivo no SQL Editor do Supabase.
--   2. Só depois enviar a versão nova do app (git push).
--
-- O que muda:
--   * O banco passa a aceitar 3 horários: 09:00, 10:00 e 14:00
--     (antes só 09:00 e 14:00). A lista do app fica em src/lib/coleta.js
--     (HORARIOS_VALIDOS): as duas precisam ser iguais.
--   * San Francisco II: coleta pela manhã, às 10h (pedido do síndico, 12/11/2026).
-- =====================================================================

-- Tira a regra antiga do horário (o nome dela foi dado pelo próprio banco).
do $$
declare
  regra text;
begin
  for regra in
    select conname from pg_constraint
     where conrelid = 'public.condominios'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%horario%'
  loop
    execute format('alter table public.condominios drop constraint %I', regra);
  end loop;
end $$;

alter table public.condominios
  add constraint condominios_horario_check check (horario in ('09:00', '10:00', '14:00'));

-- ---------- San Francisco II: 10h ----------
update public.condominios
   set horario = '10:00', atualizado_em = now()
 where id = 'condominio-san-francisco-ii';

-- Confere (o Supabase mostra só este resultado):
--   San Francisco II deve estar com 10:00; os outros continuam como estavam.
select nome, horario, dias::text as reciclaveis, dias_poda::text as podas
  from public.condominios order by nome;
