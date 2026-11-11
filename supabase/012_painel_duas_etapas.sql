-- =====================================================================
-- SEGURANÇA — Painel só com verificação em 2 etapas (senha + código do celular)
-- =====================================================================
-- ATENÇÃO, ORDEM CERTA:
--   1. Publicar a versão do app que tem a tela das 2 etapas.
--   2. Cada pessoa da equipe entrar no painel e cadastrar o app autenticador.
--   3. SÓ DEPOIS rodar este arquivo. (Antes disso, ninguém entraria no painel.)
--
-- O que muda: a equipe só lê/edita os dados se o login tiver as 2 etapas
-- ("aal2"). Quem tiver só a senha não vê nada, nem acessando o banco direto.
--
-- Se alguém perder o celular: Supabase > Authentication > Users > a pessoa >
-- apagar o fator de MFA. No próximo login o painel pede para cadastrar de novo.
-- =====================================================================

create or replace function public.eh_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     and exists (
       select 1 from public.equipe
       where email = lower(coalesce(auth.jwt() ->> 'email', ''))
     );
$$;

revoke execute on function public.eh_equipe() from public, anon;
grant execute on function public.eh_equipe() to authenticated;

-- Confere: quantas pessoas da equipe já cadastraram o app autenticador.
-- Se aparecer 0, NÃO rode este arquivo ainda (ninguém conseguiria entrar).
select e.email,
       exists (select 1 from auth.mfa_factors f join auth.users u on u.id = f.user_id
               where lower(u.email) = e.email and f.status = 'verified') as autenticador_cadastrado
from public.equipe e;
