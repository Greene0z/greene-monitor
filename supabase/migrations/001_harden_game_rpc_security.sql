-- 001_harden_game_rpc_security (já aplicada no Supabase em 2026-10-30)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'claim_game_achievement','claim_game_quest','delete_my_account','ensure_my_game_quests',
      'get_my_game_achievement_progress','get_my_game_stats','purchase_game_item',
      'refresh_my_game_quests','search_my_greene','sync_my_game_profile')
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'game_level_for_xp'
  loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;
end $$;
