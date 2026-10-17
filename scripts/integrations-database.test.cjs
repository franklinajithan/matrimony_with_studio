const { runRoadmap } = require("./roadmap-database.test.cjs");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
runRoadmap(async ({ db, ids, as }) => {
  await db.exec(`reset role;create role service_role bypassrls;grant usage on schema public,auth to service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert on storage.objects to authenticated,anon;
 alter table public.chats add column participant_details jsonb default '{}',add column last_message_text text,add column last_message_sender_id uuid,add column last_message_at timestamptz,add column unread_by jsonb default '{}';
 alter table public.messages add column text text,add column is_read boolean default false,add column created_at timestamptz default now();
 alter table public.messages enable row level security;alter table public.chats enable row level security;grant select,insert,update on public.messages,public.chats to authenticated;
 create policy chat_read on public.chats for select to authenticated using(auth.uid()in(participant_1,participant_2));create policy message_read on public.messages for select to authenticated using(exists(select 1 from public.chats c where c.id=chat_id and auth.uid()in(c.participant_1,c.participant_2)));
 alter table public.user_subscriptions add column provider text,add column provider_customer_id text,add column provider_subscription_id text,add column cancel_at_period_end boolean default false,add column updated_at timestamptz default now();
 create table public.subscription_plans(code text primary key,name text,monthly_price_pence integer,currency text,entitlements jsonb,is_active boolean,sort_order integer);create table public.biodata_share_links(id uuid primary key default gen_random_uuid(),document_id uuid,owner_id uuid,token text,snapshot jsonb,expires_at timestamptz,revoked_at timestamptz,recipient_label text,watermark text,created_at timestamptz default now());alter table public.biodata_share_links enable row level security;grant select on public.biodata_share_links to anon,authenticated;
 create policy biodata_share_links_public_select on public.biodata_share_links for select using(revoked_at is null);
 create table public.profile_share_links(id uuid primary key default gen_random_uuid(),profile_id uuid,owner_id uuid,token_hash text,expires_at timestamptz,revoked_at timestamptz);
 insert into storage.buckets(id,name,public)values('media','media',true);
 select set_config('request.jwt.claim.sub','${ids.a}',false);delete from public.member_blocks;delete from public.connections;insert into public.connections(member_a_id,member_b_id)values('${ids.a}','${ids.b}');insert into public.chats(id,participant_1,participant_2)values('test-chat','${ids.a}','${ids.b}');`);
  for (const suffix of [
    "_secure_communication_and_media.sql",
    "_provider_integrations_and_operations.sql",
  ]) {
    const file = fs
      .readdirSync(path.join(__dirname, "../supabase/migrations"))
      .find((f) => f.endsWith(suffix));
    await db.exec(
      fs.readFileSync(
        path.join(__dirname, "../supabase/migrations", file),
        "utf8",
      ),
    );
    console.log("Migration OK:", file);
  }
  let count = 0;
  const equal = (a, b) => {
    assert.deepEqual(a, b);
    count++;
  };
  const denied = async (sql) => {
    await assert.rejects(db.exec(sql));
    count++;
  };
  const rpc = async (action, payload = {}) =>
    (
      await db.query("select public.communication($1,$2::jsonb)as value", [
        action,
        JSON.stringify(payload),
      ])
    ).rows[0].value;
  await as("a");
  const requestId = "40000000-0000-4000-8000-000000000001";
  const first = await rpc("send", {
    chatId: "test-chat",
    text: "Hello",
    requestId,
  });
  equal(
    (await rpc("send", { chatId: "test-chat", text: "Hello", requestId })).id,
    first.id,
  );
  equal((await rpc("messages", { chatId: "test-chat" })).messages.length, 1);
  await denied(`update public.chats set unread_by='{}'`);
  await denied(
    `insert into public.messages(id,chat_id,sender_id,text)values(gen_random_uuid(),'test-chat','${ids.a}','Bypass')`,
  );
  await as("b");
  await rpc("read", { chatId: "test-chat" });
  await as("a");
  equal(
    (await rpc("messages", { chatId: "test-chat" })).messages[0].is_read,
    true,
  );
  await as("b");
  await rpc("send", {
    chatId: "test-chat",
    text: "Reply",
    requestId: "40000000-0000-4000-8000-000000000002",
  });
  equal(
    (await rpc("messages", { chatId: "test-chat" })).messages[1].is_read,
    false,
  );
  const attachment = await rpc("attachment_reserve", {
    chatId: "test-chat",
    name: "proof.pdf",
    size: 8,
    mimeType: "application/pdf",
  });
  await db.exec("reset role");
  await db.query(
    `insert into storage.objects(bucket_id,name,metadata)values('message-attachments',$1,'{"size":8,"mimetype":"application/pdf"}')`,
    [attachment.path],
  );
  await as("b");
  await rpc("attachment_ready", { chatId: "test-chat", id: attachment.id });
  await rpc("send", {
    chatId: "test-chat",
    text: "",
    attachmentId: attachment.id,
    requestId: "40000000-0000-4000-8000-000000000003",
  });
  equal(
    (await rpc("attachment_get", { chatId: "test-chat", id: attachment.id }))
      .name,
    "proof.pdf",
  );
  await as("support");
  await assert.rejects(
    rpc("attachment_get", { chatId: "test-chat", id: attachment.id }),
  );
  count++;
  await db.exec(
    "reset role;update cupidmatch_admin.feature_flags set enabled=true where name='calling';",
  );
  await as("b");
  await assert.rejects(
    rpc("call_start", {
      chatId: "test-chat",
      kind: "voice",
      offer: { type: "offer", sdp: "test" },
    }),
  );
  count++;
  await as("a");
  const call = await rpc("call_start", {
    chatId: "test-chat",
    kind: "voice",
    offer: { type: "offer", sdp: "test" },
  });
  await as("b");
  equal((await rpc("incoming")).calls.length, 1);
  await rpc("call_accept", { id: call.id });
  await rpc("call_answer", {
    id: call.id,
    answer: { type: "answer", sdp: "test" },
  });
  await as("a");
  equal((await rpc("call_read", { id: call.id })).call.status, "accepted");
  await rpc("call_end", { id: call.id });
  equal((await rpc("call_read", { id: call.id })).call.status, "ended");
  await denied(
    `select public.apply_identity_event('evt_bad','vs_bad','verified',true,null)`,
  );
  await denied(
    `select public.apply_stripe_subscription('evt_bad','type','${ids.a}','sub_bad','cus_bad','premium','active',now(),now()+interval '1 month',false)`,
  );
  await as("support");
  equal(
    (
      await db.query(
        `select public.feature_operations('deletion')->>'total'as value`,
      )
    ).rows[0].value,
    "0",
  );
  await denied(`select public.feature_operations('identity')`);
  await as("moderator");
  await denied(`select public.feature_operations('payments')`);
  await db.query(
    `select public.moderate_feature('attachments',$1,'Remove unsafe attachment in fixture')`,
    [attachment.id],
  );
  await as("b");
  await assert.rejects(
    rpc("attachment_get", { chatId: "test-chat", id: attachment.id }),
  );
  count++;
  await db.exec("reset role");
  await db.exec(
    `insert into public.identity_sessions(member_id,provider_session_id,status)values('${ids.a}','vs_fixture','processing');set role service_role;select public.apply_identity_event('evt_identity','vs_fixture','verified',false,null);reset role;`,
  );
  await as("a");
  equal(
    (await db.query(`select public.identity_status()as value`)).rows[0].value
      .identityVerified,
    false,
  );
  await db.exec("reset role");
  await db.exec(
    `set role service_role;select public.apply_stripe_subscription('evt_sub','customer.subscription.updated','${ids.b}','sub_fixture','cus_fixture','premium','active',now(),now()+interval '1 month',false);reset role;`,
  );
  await as("b");
  equal(
    (
      await db.query(
        `select (public.member_workspace('family_list')->>'canInvite')::boolean as value`,
      )
    ).rows[0].value,
    true,
  );
  await db.exec("reset role");
  await db.exec(
    `insert into public.biodata_share_links(owner_id,token,snapshot)values('${ids.a}','${"a".repeat(48)}','{"visibility":{"includePhoto":false,"includePhone":false,"includeEmail":false},"content":{"photoUrl":"users/private.jpg","sections":[{"id":"personal","visible":true,"fields":[{"id":"name","visible":true,"value":"Allowed"},{"id":"phone","visible":true,"value":"HIDDEN_PHONE"},{"id":"email","visible":true,"value":"HIDDEN_EMAIL"}]}]}}');select set_config('request.jwt.claim.sub','',false);set role anon;`,
  );
  await denied("select * from public.biodata_share_links");
  const shared = (
    await db.query(
      `select snapshot from public.resolve_biodata_share('${"a".repeat(48)}')`,
    )
  ).rows[0].snapshot;
  equal(JSON.stringify(shared).includes("HIDDEN_PHONE"), false);
  equal(JSON.stringify(shared).includes("HIDDEN_EMAIL"), false);
  equal(shared.content.photoUrl, undefined);
  equal(shared.content.sections[0].fields[0].value, "Allowed");
  equal(
    (
      await db.query(
        `select count(*)::int as value from public.resolve_biodata_share('${"b".repeat(48)}')`,
      )
    ).rows[0].value,
    0,
  );
  await db.exec("reset role");
  equal(
    (await db.query(`select public from storage.buckets where id='media'`))
      .rows[0].public,
    false,
  );
  await as("a");
  await db.query(
    `update public.profiles set photo_url='users/${ids.a}/profile_photo/profile.jpg',photo_privacy='hidden'where id='${ids.a}'`,
  );
  await as("b");
  equal(
    (
      await db.query(
        `select cupidmatch_admin.media_allowed('users/${ids.a}/profile_photo/profile.jpg')as value`,
      )
    ).rows[0].value,
    false,
  );
  await as("a");
  await db.query(
    `update public.profiles set photo_privacy='connections'where id='${ids.a}'`,
  );
  await as("b");
  equal(
    (
      await db.query(
        `select cupidmatch_admin.media_allowed('users/${ids.a}/profile_photo/profile.jpg')as value`,
      )
    ).rows[0].value,
    true,
  );
  await db.exec("reset role");
  await db.exec(
    `set role service_role;select public.apply_stripe_subscription('evt_order_new','type','${ids.b}','sub_fixture','cus_fixture','premium','past_due',now(),now()+interval '1 month',false,200);select public.apply_stripe_subscription('evt_order_old','type','${ids.b}','sub_fixture','cus_fixture','premium','active',now(),now()+interval '1 month',false,100);reset role;`,
  );
  equal(
    (
      await db.query(
        `select status as value from public.user_subscriptions where provider_subscription_id='sub_fixture'`,
      )
    ).rows[0].value,
    "past_due",
  );
  await as("a");
  await db.query(`select public.reserve_integration_attempt('sms_send')`);
  await denied(`select public.reserve_integration_attempt('sms_send')`);
  const exportPage = async (dataset, after = null) =>
    (
      await db.query("select public.account_export_page($1,$2::uuid)as value", [
        dataset,
        after,
      ])
    ).rows[0].value;
  equal((await exportPage("profile")).rows[0].id, ids.a);
  equal("is_admin" in (await exportPage("profile")).rows[0], false);
  equal(
    (await exportPage("sent_messages")).rows.every(
      (row) => row.sender_id === ids.a,
    ),
    true,
  );
  equal(
    (await exportPage("sent_messages")).rows.some((row) => "is_read" in row),
    false,
  );
  const oldExport = (
    await db.query("select public.member_workspace('export','{}')as value")
  ).rows[0].value;
  equal(
    oldExport.messages.some((row) => "is_read" in row),
    false,
  );
  await denied("select public.account_export_page('admin_audit_log')");
  await db.exec("reset role");
  await db.query(
    "insert into storage.objects(bucket_id,name,metadata)values('media',$1,'{\"size\":4}'),('media',$2,'{\"size\":4}')",
    [
      "users/" + ids.a + "/photos/own.png",
      "users/" + ids.b + "/photos/private.png",
    ],
  );
  await as("a");
  equal(
    (await exportPage("files")).rows.map((row) => row.path),
    ["users/" + ids.a + "/photos/own.png"],
  );
  await as("b");
  equal(
    (await exportPage("files")).rows.some((row) => row.path.includes(ids.a)),
    false,
  );
  await db.exec("reset role");
  await db.query(
    "insert into public.member_notices(id,member_id,title,body)select gen_random_uuid(),$1,'Export pagination','Own notice'from generate_series(1,105)",
    [ids.a],
  );
  await as("a");
  const firstPage = await exportPage("notices");
  equal(firstPage.rows.length, 100);
  equal(typeof firstPage.next, "string");
  const secondPage = await exportPage("notices", firstPage.next);
  equal(
    secondPage.rows.every(
      (row) => !firstPage.rows.some((first) => first.id === row.id),
    ),
    true,
  );
  equal(secondPage.next, null);
  for (const dataset of [
    "settings",
    "future_map",
    "plan_shares",
    "family_invitations",
    "family_activity",
    "support_tickets",
    "support_messages",
    "sent_interests",
    "subscriptions",
    "trials",
    "calls",
    "attachments",
    "biodata_documents",
    "biodata_shares",
    "profile_shares",
    "shortlist",
  ])
    equal(Array.isArray((await exportPage(dataset)).rows), true);
  await db.query("select public.member_workspace('deactivate','{}')");
  equal((await exportPage("profile")).rows[0].id, ids.a);
  for (let i = 0; i < 3; i++)
    await db.query("select public.reserve_account_export()");
  await denied("select public.reserve_account_export()");
  await as("anonymous");
  await denied("select public.account_export_page('profile')");
  await denied("select public.reserve_account_export()");
  console.log(
    `PASS: ${count} communication/provider/privacy PostgreSQL assertions.`,
  );
}).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
