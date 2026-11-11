-- =====================================================================
-- TESTE SEGURO do limite contra envio em massa (arquivo 006)
-- =====================================================================
-- Este teste coloca 60 respostas falsas num condomínio, tenta a 61ª e
-- depois DESFAZ TUDO. Nada fica gravado.
--
-- O resultado aparece em VERMELHO de propósito (é assim que o banco
-- desfaz tudo). Leia a mensagem:
--   "TESTE OK ..."      -> o limite funcionou
--   "TESTE FALHOU ..."  -> o limite não funcionou (me avise)
-- =====================================================================
do $$
declare
  condominio text := (select id from public.condominios order by id limit 1);
  bloqueou boolean := false;
begin
  if condominio is null then
    raise exception 'TESTE NÃO RODOU: cadastre pelo menos um condomínio antes.';
  end if;

  for i in 1..60 loop
    insert into public.respostas (tipo, condominio_id, texto)
    values ('duvida', condominio, 'teste automatico do limite - sera desfeito');
  end loop;

  begin
    insert into public.respostas (tipo, condominio_id, texto)
    values ('duvida', condominio, 'teste automatico do limite - sera desfeito');
  exception when others then
    bloqueou := sqlerrm like 'limite_de_envios%';
  end;

  if bloqueou then
    raise exception 'TESTE OK: o limite bloqueou o envio 61. Tudo foi desfeito, nada ficou gravado.';
  else
    raise exception 'TESTE FALHOU: o envio 61 passou. Tudo foi desfeito, nada ficou gravado.';
  end if;
end $$;
