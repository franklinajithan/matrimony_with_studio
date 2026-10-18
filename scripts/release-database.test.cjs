const { runIntegrations } = require("./integrations-database.test.cjs");
const assert = require("node:assert/strict");
runIntegrations(async ({ db, ids, as }) => {
  let count = 0;
  const equal = (a, b) => {
    assert.deepEqual(a, b);
    count++;
  };
  const denied = async (sql) => {
    await assert.rejects(db.exec(sql));
    count++;
  };
  const value = async (sql, args = []) =>
    (await db.query(sql, args)).rows[0].value;
  ids.erasure = "60000000-0000-4000-8000-000000000001";
  await db.exec(
    `reset role;insert into auth.users(id,email,email_confirmed_at)values('${ids.erasure}','erasure@example.test',now());insert into public.profiles(id,display_name,email)values('${ids.erasure}','Erasure fixture','erasure@example.test');`,
  );
  await as("b");
  await value(`select public.member_workspace('reactivate','{}')as value`);
  await db.exec(`reset role;
    insert into public.chats(id,participant_1,participant_2)values('erasure-chat','${ids.erasure}','${ids.b}');
    insert into public.message_attachments(chat_id,uploader_id,file_name,mime_type,byte_size,object_path,status)values('erasure-chat','${ids.b}','photo.png','image/png',8,'erasure-chat/other-member-file.png','ready');
    insert into public.messages(id,chat_id,sender_id,text)values('60000000-0000-4000-8000-000000000030','erasure-chat','${ids.erasure}','fixture message');`);
  await as("erasure");
  await denied(`select public.billing_customer('${ids.erasure}')`);
  await denied(`select public.claim_account_deletion()`);
  await value(
    `select public.member_workspace('request_deletion','{"confirmation":"DELETE"}')as value`,
  );
  let requested = await value(
    `select public.member_workspace('account','{}')->>'deletion_requested_at'as value`,
  );
  await denied(
    `select public.approve_account_deletion('${ids.erasure}','${requested}','A reviewed retention and billing reason')`,
  );
  await as("support");
  await denied(
    `select public.approve_account_deletion('${ids.erasure}','${requested}','A reviewed retention and billing reason')`,
  );
  await as("admin");
  await denied(
    `select public.approve_account_deletion('${ids.erasure}','2000-01-01','A reviewed retention and billing reason')`,
  );
  await db.exec(
    `reset role;insert into public.member_reports(reported_member_id,reporter_id,reason)values('${ids.b}','${ids.erasure}','other')`,
  );
  await as("admin");
  await denied(
    `select public.approve_account_deletion('${ids.erasure}','${requested}','Reviewed retention, billing and safety holds')`,
  );
  await db.exec(
    `reset role;delete from public.member_reports where reporter_id='${ids.erasure}'`,
  );
  await as("admin");
  equal(
    (
      await value(`select public.approve_account_deletion($1,$2,$3)as value`, [
        ids.erasure,
        requested,
        "Reviewed retention, billing and safety holds",
      ])
    ).approved,
    true,
  );
  await as("erasure");
  await value(`select public.member_workspace('cancel_deletion','{}')as value`);
  await db.exec("reset role;set role service_role");
  equal(await value("select public.claim_account_deletion()as value"), null);
  await as("erasure");
  await value(
    `select public.member_workspace('request_deletion','{"confirmation":"DELETE"}')as value`,
  );
  requested = await value(
    `select public.member_workspace('account','{}')->>'deletion_requested_at'as value`,
  );
  await as("admin");
  await value(`select public.approve_account_deletion($1,$2,$3)as value`, [
    ids.erasure,
    requested,
    "Reviewed retention, billing and safety holds",
  ]);
  await db.exec("reset role;set role service_role");
  const job = await value("select public.claim_account_deletion()as value");
  equal(job.member_id, ids.erasure);
  equal(await value("select public.claim_account_deletion()as value"), null);
  const step = (stage) =>
    value("select public.account_deletion_step($1,$2,$3)as value", [
      job.id,
      job.lease,
      stage,
    ]);
  equal((await step("inventory")).customers, []);
  await denied(
    `select public.account_deletion_step('${job.id}','60000000-0000-4000-8000-000000000099','records')`,
  );
  await as("erasure");
  await denied(`select public.member_workspace('cancel_deletion','{}')`);
  await db.exec(`reset role;
    insert into storage.objects(bucket_id,name)values('media','users/${ids.erasure}/photo.png'),('message-attachments','erasure-chat/other-member-file.png');
    set role service_role`);
  equal((await step("files")).length, 2);
  await assert.rejects(step("records"));
  count++;
  await db.exec(
    `reset role;delete from storage.objects where name in('users/${ids.erasure}/photo.png','erasure-chat/other-member-file.png');set role service_role`,
  );
  equal((await step("records")).recordsRemoved, true);
  await db.exec("reset role");
  equal(
    await value(
      `select count(*)::int as value from public.profiles where id='${ids.b}'`,
    ),
    1,
  );
  equal(
    await value(
      `select count(*)::int as value from public.messages where chat_id='erasure-chat'`,
    ),
    0,
  );
  equal(
    await value(
      `select count(*)::int as value from public.message_attachments where chat_id='erasure-chat'`,
    ),
    0,
  );
  await db.exec("set role service_role");
  await assert.rejects(step("complete"));
  count++;
  await step("failed");
  await as("admin");
  const failedQueue = await value(
    "select public.feature_operations('deletion',1,'')as value",
  );
  equal(
    failedQueue.items.find((i) => i.detail.jobId === job.id).status,
    "failed",
  );
  equal(
    failedQueue.items.find((i) => i.detail.jobId === job.id).detail
      .recordsRemoved,
    true,
  );
  await db.exec(
    `reset role;update cupidmatch_admin.account_deletion_jobs set locked_until=now()-interval '1 second'where id='${job.id}';set role service_role`,
  );
  const resumed = await value("select public.claim_account_deletion()as value");
  equal(resumed.id, job.id);
  await db.exec(
    `reset role;delete from auth.users where id='${ids.erasure}';set role service_role`,
  );
  equal(
    (
      await value("select public.account_deletion_step($1,$2,$3)as value", [
        resumed.id,
        resumed.lease,
        "complete",
      ])
    ).complete,
    true,
  );
  await db.exec(
    `reset role;insert into public.email_outbox(member_id,category,source_id,status,provider_id)values('${ids.b}','support','delivery-fixture','sent','60000000-0000-4000-8000-000000000003');set role service_role`,
  );
  const delivery = (event, status, time) =>
    value("select public.record_email_delivery($1,$2,$3,$4)as value", [
      event,
      "60000000-0000-4000-8000-000000000003",
      status,
      time,
    ]);
  equal(
    await delivery("msg_fixture1", "delivered", "2026-10-17T12:00:00Z"),
    true,
  );
  equal(
    await delivery("msg_fixture1", "delivered", "2026-10-17T12:00:00Z"),
    false,
  );
  equal(
    await delivery("msg_fixture2", "complained", "2026-10-17T12:01:00Z"),
    true,
  );
  equal(
    await delivery("msg_fixture3", "delivered", "2026-10-17T12:02:00Z"),
    false,
  );
  await as("b");
  await denied("select public.email_delivery_admin()");
  await denied(
    `select public.record_email_delivery('x','y','delivered',now())`,
  );
  equal(
    (await value(`select public.member_workspace('account','{}')as value`))
      .notification_preferences.email,
    false,
  );
  await as("admin");
  equal(
    (await value("select public.email_delivery_admin()as value")).counts
      .complained,
    1,
  );
  await as("b");
  await value(`select public.member_workspace('reactivate','{}')as value`);
  await db.exec("reset role;set role service_role");
  const first = "60000000-0000-4000-8000-000000000010",
    second = "60000000-0000-4000-8000-000000000011";
  equal(
    await value("select public.billing_checkout_lock($1,$2,false)as value", [
      ids.b,
      first,
    ]),
    true,
  );
  equal(
    await value("select public.billing_checkout_lock($1,$2,false)as value", [
      ids.b,
      second,
    ]),
    false,
  );
  await value("select public.billing_checkout_lock($1,$2,true)as value", [
    ids.b,
    second,
  ]);
  equal(
    await value("select public.billing_checkout_lock($1,$2,false)as value", [
      ids.b,
      second,
    ]),
    false,
  );
  await value("select public.billing_checkout_lock($1,$2,true)as value", [
    ids.b,
    first,
  ]);
  equal(
    await value("select public.billing_checkout_lock($1,$2,false)as value", [
      ids.b,
      second,
    ]),
    true,
  );
  equal(
    await value(`select public.billing_customer($1,'cus_fixture_b')as value`, [
      ids.b,
    ]),
    "cus_fixture",
  );
  equal(
    await value(`select public.billing_customer($1,'cus_wrong')as value`, [
      ids.b,
    ]),
    "cus_fixture",
  );
  await as("b");
  await denied(
    `select public.billing_checkout_lock('${ids.b}','${first}',false)`,
  );
  await as("b");
  await value(
    `select public.member_workspace('preferences','{"email":true}')as value`,
  );
  await db.exec(
    `reset role;update auth.users set email_confirmed_at=now()where id='${ids.b}';insert into public.member_notices(id,member_id,title,body)values('60000000-0000-4000-8000-000000000040','${ids.b}','Fixture notice','Fixture update');set role service_role`,
  );
  let mailJobs = await value("select public.claim_email_jobs()as value");
  const mailJob = mailJobs.find(
    (i) => i.category === "support" && i.email === "b@example.test",
  );
  equal(mailJob.eligible, true);
  await as("b");
  await value(
    `select public.member_workspace('preferences','{"email":false}')as value`,
  );
  await db.exec(
    `reset role;update public.email_outbox set status='pending'where id='${mailJob.id}';set role service_role`,
  );
  mailJobs = await value("select public.claim_email_jobs()as value");
  equal(mailJobs.find((i) => i.id === mailJob.id).eligible, false);
  await db.exec(
    `reset role;update public.email_outbox set attempts=5,status='sending',locked_at=now()-interval '10 minutes'where id='${mailJob.id}';set role service_role`,
  );
  await value("select public.claim_email_jobs()as value");
  await db.exec("reset role");
  equal(
    await value(
      `select status as value from public.email_outbox where id='${mailJob.id}'`,
    ),
    "failed",
  );
  await as("a");
  await value(`select public.member_workspace('reactivate','{}')as value`);
  await db.exec(
    `reset role;alter table public.match_requests add column status text default 'pending';delete from public.member_blocks;insert into public.match_requests(id,sender_id,receiver_id)values('60000000-0000-4000-8000-000000000041','${ids.a}','${ids.b}');set role service_role`,
  );
  equal(
    await value(
      `select cupidmatch_admin.email_source_allowed('${ids.b}','interests','60000000-0000-4000-8000-000000000041')as value`,
    ),
    true,
  );
  await db.exec(
    `reset role;insert into public.member_blocks(blocker_id,blocked_id)values('${ids.b}','${ids.a}');set role service_role`,
  );
  equal(
    await value(
      `select cupidmatch_admin.email_source_allowed('${ids.b}','interests','60000000-0000-4000-8000-000000000041')as value`,
    ),
    false,
  );
  console.log(
    `PASS: ${count} release billing, delivery and erasure PostgreSQL assertions.`,
  );
}).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
