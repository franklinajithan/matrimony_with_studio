do $$
declare view_sql text; updated_sql text;
begin
  view_sql := pg_get_viewdef('public.discovery_profiles'::regclass, true);
  updated_sql := replace(view_sql,
    'WHEN profiles.photo_privacy = ''hidden''::text THEN NULL::text',
    'WHEN profiles.photo_privacy = ''hidden''::text OR (profiles.photo_privacy = ''connections''::text AND NOT EXISTS (SELECT 1 FROM public.connections c WHERE (c.member_a_id = auth.uid() AND c.member_b_id = profiles.id) OR (c.member_b_id = auth.uid() AND c.member_a_id = profiles.id))) THEN NULL::text'
  );
  updated_sql := replace(updated_sql,
    'WHEN profiles.photo_privacy = ANY (ARRAY[''members''::text, ''connections''::text]) THEN profiles.additional_photo_urls',
    'WHEN profiles.photo_privacy = ''members''::text OR (profiles.photo_privacy = ''connections''::text AND EXISTS (SELECT 1 FROM public.connections c WHERE (c.member_a_id = auth.uid() AND c.member_b_id = profiles.id) OR (c.member_b_id = auth.uid() AND c.member_a_id = profiles.id))) THEN profiles.additional_photo_urls'
  );
  if updated_sql = view_sql or position('photo_privacy = ''connections''::text AND EXISTS' in updated_sql) = 0
     or position('photo_privacy = ''connections''::text AND NOT EXISTS' in updated_sql) = 0 then
    raise exception 'Expected photo privacy expressions not found; no view changes applied';
  end if;
  execute 'CREATE OR REPLACE VIEW public.discovery_profiles AS ' || updated_sql;
end $$;