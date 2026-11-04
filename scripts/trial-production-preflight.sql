-- Read-only. Run immediately before requesting/applying the targeted trial migration.
select current_setting('server_version') as postgres_version,
 to_regclass('public.premium_launch_offers') as existing_launch_table,
 to_regclass('public.member_trials') as existing_legacy_trials,
 to_regclass('public.admin_audit_log') as audit_table,
 to_regprocedure('private.account_session_active()') as session_guard,
 to_regprocedure('public.member_is_active(uuid)') as member_guard,
 to_regprocedure('public.is_admin()') as admin_guard,
 to_regprocedure('public.activate_member_trial(text)') as old_claim_route;
select table_name,column_name,data_type from information_schema.columns
 where table_schema='public' and table_name in ('member_trials','admin_audit_log')
 order by table_name,ordinal_position;
select version,name from supabase_migrations.schema_migrations order by version desc limit 5;
