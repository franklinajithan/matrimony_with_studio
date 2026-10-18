const { run } = require("./admin-database.test.cjs");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
async function runWebsite(extra) {
  return run(async ({ db, ids, as, handler, request, apiMocks }) => {
    await db.exec(`reset role;
 alter table public.profiles add column photo_privacy text default 'members',add column data_ai_hint text,add column dob text,add column languages jsonb,add column relationship_intentions jsonb,add column values_lifestyle jsonb,add column cultural_family jsonb,add column settlement jsonb,add column extra jsonb;
 create table public.user_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles,plan_code text,status text,current_period_start timestamptz,current_period_end timestamptz,created_at timestamptz default now());
 create table public.member_trials(user_id uuid primary key references public.profiles,starts_at timestamptz,ends_at timestamptz);
 create function public.age_from_dob(text)returns integer language sql immutable as $$select null::integer$$;
 delete from public.member_blocks;delete from public.connections;
 update public.profiles set is_published=true,suspended_at=null,photo_url='https://example.test/private.jpg',additional_photo_urls='["https://example.test/extra.jpg"]',photo_privacy='connections'where id in('${ids.a}','${ids.b}');`);
    const filename = fs
      .readdirSync(path.join(__dirname, "../supabase/migrations"))
      .find((f) => f.endsWith("_website_support_and_profile_activity.sql"));
    await db.exec(
      fs.readFileSync(
        path.join(__dirname, "../supabase/migrations", filename),
        "utf8",
      ),
    );
    let count = 0;
    async function check(sql, expected) {
      const { rows } = await db.query(sql);
      assert.deepEqual(rows[0]?.value, expected, sql);
      count++;
    }
    async function denied(sql) {
      await assert.rejects(db.exec(sql));
      count++;
    }
    await as("admin");
    await db.exec(
      `select public.admin_set_staff('${ids.support}','support','Assign support test responsibilities')`,
    );
    await as("a");
    const firstRequest = "20000000-0000-4000-8000-000000000001";
    const ticket = (
      await db.query(
        `select public.create_support_ticket('account','Help with profile','Please help with my profile settings.',$1) as id`,
        [firstRequest],
      )
    ).rows[0].id;
    await check(
      `select public.create_support_ticket('account','Help with profile','Please help with my profile settings.','${firstRequest}')as value`,
      ticket,
    );
    await check(
      `select (public.support_tickets_list()->>'total')::int as value`,
      1,
    );
    await check(
      `select jsonb_array_length(public.support_ticket_thread('${ticket}')->'messages')as value`,
      1,
    );
    await denied(`select * from public.support_messages`);
    await denied(
      `insert into public.support_tickets(member_id,request_id,category,subject)values('${ids.a}',gen_random_uuid(),'account','Bypass the RPC')`,
    );
    await as("b");
    await check(
      `select (public.support_tickets_list()->>'total')::int as value`,
      0,
    );
    await denied(`select public.support_ticket_thread('${ticket}')`);
    await denied(
      `select public.reply_support_ticket('${ticket}','Spoofed unrelated member',gen_random_uuid())`,
    );
    await as("moderator");
    await denied(`select public.support_tickets_list(true)`);
    await denied(
      `select public.update_support_ticket('${ticket}','resolved',null,'Moderator has no support scope',now())`,
    );
    await as("support");
    await check(`select public.admin_has_permission('support')as value`, true);
    await check(
      `select (public.support_tickets_list(true)->>'total')::int as value`,
      1,
    );
    let snapshot = (
      await db.query(
        `select public.support_ticket_thread('${ticket}')->'ticket'->>'updated_at'as value`,
      )
    ).rows[0].value;
    await db.query(
      `select public.update_support_ticket($1,'in_progress',true,'I will investigate this request',$2)`,
      [ticket, snapshot],
    );
    await check(
      `select public.support_ticket_thread('${ticket}')->'ticket'->>'assigned_to'as value`,
      ids.support,
    );
    await assert.rejects(
      db.query(
        `select public.update_support_ticket($1,'resolved',null,'Stale state should be rejected',$2)`,
        [ticket, snapshot],
      ),
    );
    count++;
    const replyId = "20000000-0000-4000-8000-000000000002";
    const reply = (
      await db.query(
        `select public.reply_support_ticket($1,'Please review the privacy page for this setting.',$2)as id`,
        [ticket, replyId],
      )
    ).rows[0].id;
    await check(
      `select public.reply_support_ticket('${ticket}','Please review the privacy page for this setting.','${replyId}')as value`,
      reply,
    );
    await check(
      `select public.support_ticket_thread('${ticket}')->'ticket'->>'status'as value`,
      "waiting_on_member",
    );
    await as("a");
    await check(
      `select public.support_ticket_thread('${ticket}')->'messages'->1->>'body'as value`,
      "Please review the privacy page for this setting.",
    );
    await check(
      `select count(*)::int as value from public.member_notices where title='CupidMatch support replied'`,
      1,
    );
    await check(
      `select public.support_ticket_thread('${ticket}')->'ticket'->'assigned_to'as value`,
      null,
    );
    await as("support");
    snapshot = (
      await db.query(
        `select public.support_ticket_thread('${ticket}')->'ticket'->>'updated_at'as value`,
      )
    ).rows[0].value;
    await db.query(
      `select public.update_support_ticket($1,'resolved',null,'Question answered in the support reply',$2)`,
      [ticket, snapshot],
    );
    await as("a");
    await db.exec(
      `select public.reply_support_ticket('${ticket}','I have a follow-up question.',gen_random_uuid())`,
    );
    await check(
      `select public.support_ticket_thread('${ticket}')->'ticket'->>'status'as value`,
      "in_progress",
    );
    await db.exec(
      `select public.create_support_ticket('other','Second support request','Another question to support.',gen_random_uuid());select public.create_support_ticket('profile','Third support request','A question about my profile.',gen_random_uuid());`,
    );
    await denied(
      `select public.create_support_ticket('account','Fourth support request','Rate limited request should fail.',gen_random_uuid())`,
    );
    await check(
      `select public.create_support_ticket('account','Help with profile','Please help with my profile settings.','${firstRequest}')as value`,
      ticket,
    );
    await as("b");
    await check(`select public.record_profile_visit('${ids.a}')as value`, true);
    await check(
      `select public.record_profile_visit('${ids.b}')as value`,
      false,
    );
    await as("a");
    await check(`select public.profile_visitors()->>'locked'as value`, "true");
    await denied(`select * from public.profile_visits`);
    await db.exec("reset role");
    await db.exec(
      `insert into public.member_trials(user_id,starts_at,ends_at)values('${ids.a}',now()-interval '1 day',now()+interval '1 month')`,
    );
    await as("a");
    await check(`select public.profile_visitors()->>'locked'as value`, "false");
    await check(
      `select (public.profile_visitors()->>'total')::int as value`,
      1,
    );
    await check(
      `select public.profile_visitors()->'viewers'->0->'photo_url'as value`,
      null,
    );
    await check(
      `select photo_url as value from public.discovery_profiles where id='${ids.b}'`,
      null,
    );
    await check(
      `select additional_photo_urls as value from public.discovery_profiles where id='${ids.b}'`,
      [],
    );
    await db.exec("reset role");
    await db.exec(
      `insert into public.connections(member_a_id,member_b_id)values('${ids.a}','${ids.b}')`,
    );
    await as("a");
    await check(
      `select photo_url as value from public.discovery_profiles where id='${ids.b}'`,
      "https://example.test/private.jpg",
    );
    await check(
      `select public.profile_visitors()->'viewers'->0->>'photo_url'as value`,
      "https://example.test/private.jpg",
    );
    await as("b");
    await denied(`select public.profile_activity_settings(true)`);
    await db.exec("reset role");
    await db.exec(
      `insert into public.user_subscriptions(user_id,plan_code,status,current_period_start,current_period_end)values('${ids.b}','premium_plus','active',now()-interval '1 day',now()+interval '1 month');delete from public.profile_visits;`,
    );
    await as("b");
    await check(
      `select public.profile_activity_settings(true)->>'incognito'as value`,
      "true",
    );
    await check(
      `select public.record_profile_visit('${ids.a}')as value`,
      false,
    );
    await as("a");
    await check(
      `select (public.profile_visitors()->>'total')::int as value`,
      0,
    );
    await db.exec("reset role");
    await db.exec(
      `update public.user_subscriptions set current_period_end=now()-interval '1 minute'where user_id='${ids.b}'`,
    );
    await as("b");
    await check(
      `select public.profile_activity_settings()->>'incognito'as value`,
      "false",
    );
    await check(`select public.record_profile_visit('${ids.a}')as value`, true);
    await as("a");
    await db.exec(
      `insert into public.member_blocks(blocker_id,blocked_id)values('${ids.a}','${ids.b}')`,
    );
    await check(
      `select count(*)::int as value from public.discovery_profiles where id='${ids.b}'`,
      0,
    );
    await check(
      `select (public.profile_visitors()->>'total')::int as value`,
      0,
    );
    await check(
      `select public.own_blocks_list()->'blocks'->0->>'display_name'as value`,
      "b",
    );
    await as("b");
    await check(
      `select count(*)::int as value from public.discovery_profiles where id='${ids.a}'`,
      0,
    );
    await check(
      `select public.record_profile_visit('${ids.a}')as value`,
      false,
    );
    await as("support");
    await check(
      `select public.record_profile_visit('${ids.a}')as value`,
      false,
    );
    await as("admin");
    await check(
      `select count(*)::int as value from public.admin_audit_log where action='support_replied'`,
      1,
    );
    await db.exec("reset role");
    await db.exec("set role anon");
    await denied("select * from public.discovery_profiles");
    await denied("select public.profile_visitors()");
    await denied(`select public.support_ticket_thread('${ticket}')`);
    // Real support/activity HTTP handlers call the database through the same adapter.
    const rpcFactory =
      apiMocks["@/lib/supabase/server"].createSupabaseServerClient;
    apiMocks["@/lib/supabase/server"].createSupabaseServerClient =
      async () => ({
        ...(await rpcFactory()),
        auth: {
          getUser: async () => {
            const { rows } = await db.query("select auth.uid()as id");
            return {
              data: { user: rows[0].id ? { id: rows[0].id } : null },
              error: null,
            };
          },
        },
      });
    await as("a");
    let api = handler("src/app/api/support/route.ts");
    let response = await api.GET(request("/api/support"));
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 3);
    count += 2;
    response = await api.POST(
      request("/api/support", {
        category: "account",
        subject: "HTTP request four",
        body: "Rate limiting must also work through the API.",
        requestId: "20000000-0000-4000-8000-000000000099",
      }),
    );
    assert.equal(response.status, 429);
    count++;
    await as("b");
    api = handler("src/app/api/support/[ticketId]/route.ts");
    response = await api.GET(request("/api/support/" + ticket), {
      params: Promise.resolve({ ticketId: ticket }),
    });
    assert.equal(response.status, 404);
    count++;
    await as("support");
    api = handler("src/app/api/admin/support/route.ts");
    response = await api.GET(request("/api/admin/support"));
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 3);
    count += 2;
    await as("b");
    api = handler("src/app/api/members/activity/route.ts");
    response = await api.GET(request("/api/members/activity"));
    assert.equal(response.status, 200);
    assert.equal(response.body.locked, true);
    count += 2;
    console.log(
      `PASS: ${count} additional website database/API assertions (support ownership, rate limits, idempotency, activity entitlements, incognito, blocks and connection-only photo privacy).`,
    );
    if (extra) await extra({ db, ids, as, handler, request, apiMocks });
  });
}
module.exports = { runWebsite };
if (require.main === module)
  runWebsite().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
