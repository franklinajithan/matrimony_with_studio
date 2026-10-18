const { PGlite } = require("@electric-sql/pglite");
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
async function run(extra) {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema cupidmatch_admin;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now(),last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
create table public.profiles(id uuid primary key references auth.users(id),display_name text,email text,bio text,photo_url text,additional_photo_urls jsonb default '[]',subscription_plan text,subscription_entitlements jsonb,is_admin boolean default false,is_verified boolean default false,is_published boolean default true,suspended_at timestamptz,suspension_reason text,created_at timestamptz default now(),updated_at timestamptz default now(),location text,profession text,height text,religion text,caste text,language text,hobbies text,favorite_movies text,favorite_music text,education_level text,smoking_habits text,drinking_habits text,country text,region text);
alter table public.profiles enable row level security;grant select,update on public.profiles to authenticated;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select coalesce((select is_admin from public.profiles where id=auth.uid()),false) $$;
create policy self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy self_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create function public.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end$$;
create table public.success_stories(id uuid primary key default gen_random_uuid(),couple_names text,story_text text,original_story_text text,photo_url text,submitted_by_uid uuid,status text default 'pending',admin_notes text,submitted_at timestamptz default now(),updated_at timestamptz default now(),approved_at timestamptz);
alter table public.success_stories enable row level security;
grant select,insert,update,delete on public.success_stories to authenticated;
create policy story_insert on public.success_stories for insert to authenticated with check(submitted_by_uid=auth.uid() or submitted_by_uid is null);
create policy admin_stories on public.success_stories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create table public.connections(id uuid primary key default gen_random_uuid(),member_a_id uuid references public.profiles,member_b_id uuid references public.profiles,connected_at timestamptz default now());
alter table public.connections enable row level security;grant select on public.connections to authenticated;
create table public.match_requests(id uuid primary key,sender_id uuid,receiver_id uuid);
create table public.chats(id text primary key,participant_1 uuid,participant_2 uuid);
create table public.messages(id uuid primary key,chat_id text,sender_id uuid);
`);
  for (const file of [
    "20260926120000_admin_audit_log_live_alignment.sql",
    "20260926130000_member_verification_requests.sql",
    "20260926140000_audited_profile_review_decisions.sql",
    "20260926150000_protect_profile_privileged_fields.sql",
    "20260926152500_validate_admin_member_edit.sql",
    "20260926223000_member_notes_audit.sql",
    "20260926224000_admin_connection_removal.sql",
    "20260926225000_admin_extended_profile_edit.sql",
    "20260926232000_admin_member_suspension.sql",
    "20260929000000_member_reports_system.sql",
    "20260929000100_member_blocks_system.sql",
    "20260929000300_admin_dashboard_report_counts.sql",
    ...fs
      .readdirSync(path.join(root, "supabase/migrations"))
      .filter((f) => f.endsWith("_admin_operations_completion.sql")),
  ]) {
    try {
      await db.exec(
        fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8"),
      );
      console.log("Migration OK:", file);
    } catch (e) {
      throw new Error(file + ": " + e.message);
    }
  }
  const ids = {
    admin: "00000000-0000-4000-8000-000000000001",
    support: "00000000-0000-4000-8000-000000000002",
    moderator: "00000000-0000-4000-8000-000000000003",
    a: "00000000-0000-4000-8000-000000000004",
    b: "00000000-0000-4000-8000-000000000005",
  };
  for (const [name, id] of Object.entries(ids)) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      name + "@example.test",
    ]);
    await db.query(
      "insert into public.profiles(id,display_name,email,is_admin,bio,photo_url,additional_photo_urls) values($1,$2,$3,$4,'Old bio','https://example.test/main.jpg','[\"https://example.test/extra.jpg\"]')",
      [id, name, name + "@example.test", name === "admin"],
    );
  }
  async function as(name) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ids[name] || "",
    ]);
    await db.exec("set role authenticated");
  }
  let checks = 0;
  async function check(sql, expected) {
    const { rows } = await db.query(sql);
    assert.deepEqual(rows[0]?.value, expected, sql);
    checks++;
  }
  async function denied(sql) {
    await assert.rejects(db.exec(sql));
    checks++;
  }
  await as("admin");
  await check(
    `select (public.admin_set_staff('${ids.support}','support','Assigned to customer support')->>'updated')::boolean as value`,
    true,
  );
  await check(
    `select (public.admin_set_staff('${ids.moderator}','moderator','Assigned to moderation team')->>'updated')::boolean as value`,
    true,
  );
  for (const [role, allowed, disallowed] of [
    [
      "support",
      ["members", "notifications", "member_read", "notes"],
      ["manage", "billing", "moderation", "content"],
    ],
    [
      "moderator",
      ["moderation", "content", "member_read", "notes"],
      ["manage", "billing", "members", "notifications"],
    ],
    [
      "a",
      [],
      [
        "workspace",
        "members",
        "moderation",
        "content",
        "billing",
        "notifications",
        "manage",
      ],
    ],
  ]) {
    await as(role);
    for (const p of allowed)
      await check(`select public.admin_has_permission('${p}') as value`, true);
    for (const p of disallowed)
      await check(`select public.admin_has_permission('${p}') as value`, false);
    await denied(
      `select public.admin_set_staff('${ids.b}','moderator','Unauthorized role escalation')`,
    );
  }
  await as("support");
  await db.exec(
    `select public.admin_edit_member('${ids.a}','New name','London','Engineer','Updated bio')`,
  );
  await check(
    `select display_name as value from public.profiles where id='${ids.a}'`,
    "New name",
  );
  await denied(
    `select public.admin_set_member_suspension('${ids.a}',true,'Support cannot suspend members')`,
  );
  await db.exec(
    `select public.admin_send_member_notice('${ids.a}','Service update','Please review your profile details.')`,
  );
  await check(`select count(*)::int as value from public.member_notices`, 1);
  await as("a");
  await denied(`update public.profiles set is_admin=true where id='${ids.a}'`);
  await denied(
    `insert into public.success_stories(couple_names,story_text,status,submitted_by_uid) values('Forged','Forged','approved','${ids.a}')`,
  );
  await denied(`select admin_notes from public.success_stories`);
  await as("a");
  await check(`select count(*)::int as value from public.member_notices`, 1);
  let notice = (await db.query("select id from public.member_notices")).rows[0]
    .id;
  await check(
    `select public.mark_member_notice_read('${notice}') as value`,
    true,
  );
  await denied(
    `select public.admin_send_member_notice('${ids.b}','Spoofed sender','This should fail.')`,
  );
  await as("b");
  await check(`select count(*)::int as value from public.member_notices`, 0);
  await check(
    `select public.mark_member_notice_read('${notice}') as value`,
    false,
  );
  await denied(`select public.is_blocked_between('${ids.a}','${ids.support}')`);
  await denied(`select public.count_member_reports('${ids.a}')`);
  await denied(
    `insert into public.member_reports(reporter_id,reported_member_id,reason,status,reviewed_at)values('${ids.b}','${ids.a}','spam','resolved',now())`,
  );
  await db.exec(
    `insert into public.member_reports(reporter_id,reported_member_id,reason)values('${ids.b}','${ids.a}','spam')`,
  );
  await check(`select count(*)::int as value from public.member_reports`, 1);
  await as("a");
  await check(`select count(*)::int as value from public.member_reports`, 0);
  await as("moderator");
  await check(`select public.count_member_reports('${ids.a}') as value`, 1);
  await check(
    `select (public.admin_reports_list('all','all','New name',null,null,1)->>'total')::int as value`,
    1,
  );
  await check(
    `select jsonb_array_length(public.admin_reports_list('all','all','not a match',null,null,1)->'reports') as value`,
    0,
  );
  const report = (await db.query("select id from public.member_reports"))
    .rows[0].id;
  await db.exec(
    `select public.admin_update_report_status('${report}','resolved','Investigated and resolved')`,
  );
  await denied(
    `update public.member_reports set status='open' where id='${report}'`,
  );
  await db.exec(
    `select public.admin_set_member_suspension('${ids.a}',true,'Confirmed moderation concern')`,
  );
  await db.exec(
    `select public.admin_set_member_suspension('${ids.a}',false,'Moderation concern resolved')`,
  );
  await check(
    `select (public.admin_content_queue('',1)->>'total')::int as value`,
    4,
  );
  await denied(
    `select public.admin_moderate_content('${ids.a}','photo','https://example.test/stale.jpg','Invalid photo reference test')`,
  );
  await db.exec(
    `select public.admin_moderate_content('${ids.a}','photo','https://example.test/main.jpg','Removed inappropriate image')`,
  );
  await check(
    `select photo_url is null as value from public.profiles where id='${ids.a}'`,
    true,
  );
  await db.exec(
    `select public.admin_moderate_content('${ids.a}','photo','https://example.test/extra.jpg','Removed inappropriate image')`,
  );
  await check(
    `select additional_photo_urls as value from public.profiles where id='${ids.a}'`,
    [],
  );
  await db.exec(
    `select public.admin_moderate_content('${ids.a}','bio','Updated bio','Removed inappropriate biography')`,
  );
  await db.exec(
    `select public.admin_moderate_content('${ids.a}','unpublish',null,'Profile awaiting further review')`,
  );
  await check(
    `select is_published as value from public.profiles where id='${ids.a}'`,
    false,
  );
  await db.exec("reset role");
  const story = (
    await db.query(
      "insert into public.success_stories(couple_names,story_text)values('Test couple','Test story')returning id,updated_at",
    )
  ).rows[0];
  await as("moderator");
  await denied(
    `select public.admin_review_story('${story.id}','approved','Short',null)`,
  );
  await db.query(
    `select public.admin_review_story($1,'approved','Reviewed submission and consent',$2)`,
    [story.id, story.updated_at],
  );
  checks++;
  await assert.rejects(
    db.query(
      `select public.admin_review_story($1,'rejected','Conflicting concurrent review',$2)`,
      [story.id, story.updated_at],
    ),
  );
  checks++;
  await check(
    `select status as value from public.success_stories where id='${story.id}'`,
    "approved",
  );
  await denied(
    `update public.success_stories set status='rejected' where id='${story.id}'`,
  );
  await as("a");
  await denied(`select public.admin_stories_list('all',1)`);
  await check(
    `select count(*)::int as value from public.published_success_stories()`,
    1,
  );
  await as("moderator");
  await check(
    `select public.admin_stories_list('approved',1)->'stories'->0->>'admin_notes' as value`,
    "Reviewed submission and consent",
  );
  await as("admin");
  await check(
    `select count(*)::int as value from public.content_moderation_log`,
    4,
  );
  await check(`select count(*)::int as value from public.admin_audit_log`, 12);
  await db.exec(
    `select public.admin_set_staff('${ids.support}','none','Removed delegated staff access')`,
  );
  await as("support");
  await check(
    `select public.admin_has_permission('workspace') as value`,
    false,
  );
  await as("moderator");
  await check(
    `select (public.admin_dashboard_counts()->>'members')::int as value`,
    4,
  );
  await as("a");
  await db.exec("reset role");
  await db.exec(
    `insert into public.connections(member_a_id,member_b_id)values('${ids.a}','${ids.b}')`,
  );
  await db.exec("set role authenticated");
  await db.exec(
    `insert into public.member_blocks(blocker_id,blocked_id)values('${ids.a}','${ids.b}')`,
  );
  await check(`select public.has_block_with('${ids.b}') as value`, true);
  await db.exec("reset role");
  await check(`select count(*)::int as value from public.connections`, 0);
  await denied(
    `insert into public.connections(member_a_id,member_b_id)values('${ids.a}','${ids.b}')`,
  );
  await as("b");
  await check(`select public.has_block_with('${ids.a}') as value`, true);
  await as("admin");
  await db.exec(
    `select public.admin_set_member_suspension('${ids.moderator}',true,'Staff account temporarily suspended')`,
  );
  await as("moderator");
  await check(
    `select public.admin_has_permission('workspace') as value`,
    false,
  );
  await denied(`select public.admin_content_queue('',1)`);
  await as("admin");
  await db.exec(
    `select public.admin_set_member_suspension('${ids.moderator}',false,'Staff account suspension reviewed')`,
  );
  await as("moderator");
  await check(`select public.admin_has_permission('workspace') as value`, true);
  await denied(`select public.admin_members_list('all','','newest',1)`);
  await as("admin");
  await check(
    `select (public.admin_members_list('all','','newest',1)->>'total')::int as value`,
    5,
  );
  await check(
    `select (public.admin_members_list('admins','','name',1)->>'total')::int as value`,
    1,
  );
  await denied(`select public.admin_members_list('invalid','','newest',1)`);
  await denied(`select public.admin_members_list('all','','newest',0)`);
  await db.exec("reset role");
  await db.exec(`insert into auth.users(id,email) select ('10000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'paging'||i||'@example.test' from generate_series(1,30)i;
  insert into public.profiles(id,display_name,email)select id,'Paging test '||email,email from auth.users where email like 'paging%';
  insert into public.member_reports(reporter_id,reported_member_id,reason)select '${ids.b}','${ids.a}','spam' from generate_series(1,25);`);
  await as("admin");
  await check(
    `select (public.admin_members_list('all','Paging test','newest',1)->>'total')::int as value`,
    30,
  );
  await check(
    `select jsonb_array_length(public.admin_members_list('all','Paging test','newest',1)->'members') as value`,
    12,
  );
  await check(
    `select jsonb_array_length(public.admin_members_list('all','Paging test','newest',3)->'members') as value`,
    6,
  );
  await check(
    `select count(distinct item->>'id')::int as value from jsonb_array_elements((public.admin_members_list('all','Paging test','newest',1)->'members')||(public.admin_members_list('all','Paging test','newest',2)->'members'))item`,
    24,
  );
  await check(
    `select (public.admin_members_list('all','x'' OR true --','newest',1)->>'total')::int as value`,
    0,
  );
  await check(
    `select (public.admin_reports_list('all','all','',null,null,1)->>'total')::int as value`,
    26,
  );
  await check(
    `select jsonb_array_length(public.admin_reports_list('all','all','',null,null,1)->'reports') as value`,
    20,
  );
  await check(
    `select jsonb_array_length(public.admin_reports_list('all','all','',null,null,2)->'reports') as value`,
    6,
  );
  await check(
    `select (public.admin_reports_list('all','all','',now()+interval '1 day',null,1)->>'total')::int as value`,
    0,
  );
  // Exercise the real API handlers against PostgreSQL, retaining database authorization.
  const vm = require("node:vm");
  const ts = require("typescript");
  const rpcCalls = [];
  const apiMocks = {
    "next/server": {
      NextResponse: {
        json: (body, init) => ({
          body,
          status: init?.status ?? 200,
          headers: init?.headers,
        }),
      },
    },
    "@/lib/auth/admin": {
      requireServerAdmin: async (permission = "manage") => {
        const result = await db.query(
          "select public.admin_has_permission($1) as allowed",
          [permission],
        );
        return result.rows[0].allowed
          ? { id: "authenticated-test-actor" }
          : null;
      },
    },
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        rpc: async (name, args) => {
          assert.match(name, /^[a-z_]+$/);
          rpcCalls.push(name);
          const entries = Object.entries(args ?? {});
          const sql = `select public.${name}(${entries
            .map(([key], i) => {
              assert.match(key, /^[a-z_]+$/);
              return `${key}=>$${i + 1}`;
            })
            .join(",")}) as result`;
          try {
            const result = await db.query(
              sql,
              entries.map(([, value]) => value),
            );
            return { data: result.rows[0].result, error: null };
          } catch (error) {
            return { data: null, error: { code: error.code } };
          }
        },
      }),
    },
  };
  function handler(relative) {
    const filename = path.join(root, relative),
      module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const load = (name) => {
      if (name === "zod") return require("zod");
      if (name === "@/lib/admin/http") return handler("src/lib/admin/http.ts");
      if (apiMocks[name]) return apiMocks[name];
      throw new Error("Unexpected API import: " + name);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
      filename,
    })(load, module, module.exports);
    return module.exports;
  }
  function request(url, body) {
    return new Request("http://localhost" + url, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  await as("moderator");
  let api = handler("src/app/api/admin/members/route.ts");
  assert.equal((await api.GET(request("/api/admin/members"))).status, 403);
  checks++;
  await as("admin");
  let response = await api.GET(
    request("/api/admin/members?search=Paging%20test&page=2"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.members.length, 12);
  assert.equal(response.body.total, 30);
  checks += 3;
  let callsBefore = rpcCalls.length;
  assert.equal(
    (await api.GET(request("/api/admin/members?page=0"))).status,
    400,
  );
  assert.equal(rpcCalls.length, callsBefore);
  checks += 2;
  api = handler("src/app/api/admin/reports/route.ts");
  response = await api.GET(request("/api/admin/reports?page=2"));
  assert.equal(response.body.reports.length, 6);
  assert.equal(response.body.total, 26);
  checks += 2;
  callsBefore = rpcCalls.length;
  assert.equal(
    (
      await api.GET(
        request("/api/admin/reports?dateFrom=2026-10-20&dateTo=2026-10-01"),
      )
    ).status,
    400,
  );
  assert.equal(rpcCalls.length, callsBefore);
  checks += 2;
  api = handler("src/app/api/admin/staff/route.ts");
  response = await api.POST(
    request("/api/admin/staff", {
      memberId: ids.support,
      role: "support",
      reason: "Restoring support after tests",
    }),
  );
  assert.equal(response.status, 200);
  checks++;
  await as("support");
  response = await api.POST(
    request("/api/admin/staff", {
      memberId: ids.b,
      role: "moderator",
      reason: "Unauthorized change request",
    }),
  );
  assert.equal(response.status, 403);
  checks++;
  api = handler("src/app/api/admin/notifications/route.ts");
  response = await api.POST(
    request("/api/admin/notifications", {
      memberId: ids.b,
      title: "API integration check",
      body: "Test of the real handler and database.",
    }),
  );
  assert.equal(response.status, 200);
  checks++;
  await as("b");
  await check(
    `select title as value from public.member_notices where member_id='${ids.b}'`,
    "API integration check",
  );
  await as("moderator");
  api = handler("src/app/api/admin/success-stories/route.ts");
  response = await api.GET(
    request("/api/admin/success-stories?status=approved"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.stories[0].id, story.id);
  checks += 2;
  response = await api.POST(
    request("/api/admin/success-stories", {
      storyId: story.id,
      status: "rejected",
      note: "Conflicting review from API",
      expectedUpdatedAt: story.updated_at.toISOString(),
    }),
  );
  assert.equal(response.status, 409);
  checks++;
  await as("admin");
  await db.exec(
    `select public.admin_set_member_suspension('${ids.support}',true,'Suspending staff before access removal')`,
  );
  await db.exec(
    `select public.admin_set_staff('${ids.support}','none','Remove access from suspended staff')`,
  );
  await as("support");
  await check(
    `select public.admin_has_permission('workspace') as value`,
    false,
  );
  await as("admin");
  await db.exec(
    `select public.admin_set_member_suspension('${ids.support}',false,'Restoring the member account only')`,
  );
  await as("support");
  await check(
    `select public.admin_has_permission('workspace') as value`,
    false,
  );
  console.log(
    `PASS: ${checks} database assertions (real PostgreSQL, RLS, scoped roles, ownership, audit, concurrency and moderation).`,
  );
  if (extra)
    await extra({ db, ids, as, check, denied, handler, request, apiMocks });
  await db.close();
}
module.exports = { run };
if (require.main === module)
  run().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
