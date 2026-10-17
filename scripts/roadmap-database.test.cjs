const { runWebsite } = require("./website-database.test.cjs");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
async function runRoadmap(extra) {
  return runWebsite(async ({ db, ids, as, handler, request, apiMocks }) => {
    await db.exec("reset role");
    const file = fs
      .readdirSync(path.join(__dirname, "../supabase/migrations"))
      .find((f) => f.endsWith("_member_planning_and_account_controls.sql"));
    await db.exec(
      fs.readFileSync(
        path.join(__dirname, "../supabase/migrations", file),
        "utf8",
      ),
    );
    let count = 0;
    const rpc = async (action, payload = {}) =>
      (
        await db.query(
          "select public.member_workspace($1,$2::jsonb) as value",
          [action, JSON.stringify(payload)],
        )
      ).rows[0].value;
    const denied = async (action, payload = {}) => {
      await assert.rejects(rpc(action, payload));
      count++;
    };
    const equal = (a, b) => {
      assert.deepEqual(a, b);
      count++;
    };
    await db.exec(
      `delete from public.member_blocks;delete from public.connections;update public.profiles set suspended_at=null,is_published=true;insert into public.member_trials(user_id,starts_at,ends_at)values('${ids.a}',now()-interval '1 day',now()+interval '5 days')on conflict(user_id)do update set ends_at=excluded.ends_at;`,
    );
    await as("a");
    await rpc("plan_save", {
      plan: {
        currentLocation: "London",
        futureLocation: "Colombo",
        milestones: [{ title: "Discuss relocation", done: false }],
      },
      version: 0,
    });
    equal((await rpc("plan_list")).own.version, 1);
    await denied("plan_save", {
      plan: { currentLocation: "Overwrite" },
      version: 0,
    });
    await denied("plan_save", {
      plan: { milestones: [{ title: "bad", done: "true" }] },
      version: 1,
    });
    await denied("plan_share", { viewerId: ids.b });
    await as("b");
    equal((await rpc("plan_list")).own, null);
    equal((await rpc("plan_list")).sharedWithMe.length, 0);
    await denied("family_invite", {
      email: "a@example.test",
      relationship: "parent",
      permissions: { viewPlan: true },
    });
    await as("a");
    const invitation = (
      await rpc("family_invite", {
        email: "b@example.test",
        relationship: "sibling",
        permissions: { viewPlan: true, comment: true, suggest: false },
      })
    ).id;
    await as("moderator");
    await denied("family_respond", { id: invitation, response: "accepted" });
    await denied("family_activity", { id: invitation });
    await as("b");
    equal((await rpc("family_list")).invitations.length, 1);
    await rpc("family_respond", { id: invitation, response: "accepted" });
    equal(
      (await rpc("family_list")).invitations[0].plan.currentLocation,
      "London",
    );
    await rpc("family_post", {
      id: invitation,
      kind: "comment",
      body: "Happy to help with planning",
    });
    equal(
      (await rpc("family_activity", { id: invitation })).activity[0].body,
      "Happy to help with planning",
    );
    await denied("family_post", {
      id: invitation,
      kind: "suggestion",
      body: "Please look",
      targetId: ids.support,
    });
    await as("a");
    await rpc("family_permissions", {
      id: invitation,
      permissions: { viewPlan: false, comment: false, suggest: false },
    });
    await as("b");
    equal((await rpc("family_list")).invitations[0].plan, null);
    await denied("family_post", {
      id: invitation,
      kind: "comment",
      body: "Not allowed",
    });
    await as("a");
    await rpc("family_revoke", { id: invitation });
    await as("b");
    await denied("family_activity", { id: invitation });
    await db.exec("reset role");
    await db.exec(
      `insert into public.connections(member_a_id,member_b_id)values('${ids.a}','${ids.b}');`,
    );
    await as("a");
    await rpc("plan_share", { viewerId: ids.b });
    await as("b");
    equal((await rpc("plan_list")).sharedWithMe.length, 1);
    await rpc("deactivate");
    await denied("plan_list");
    await rpc("reactivate");
    equal((await rpc("plan_list")).sharedWithMe.length, 1);
    await as("a");
    await rpc("deactivate");
    await as("b");
    equal((await rpc("plan_list")).sharedWithMe.length, 0);
    equal(
      (
        await db.query(
          `select count(*)::int as value from public.discovery_profiles where id='${ids.a}'`,
        )
      ).rows[0].value,
      0,
    );
    await as("a");
    await rpc("reactivate");
    await rpc("plan_unshare", { viewerId: ids.b });
    await as("b");
    equal((await rpc("plan_list")).sharedWithMe.length, 0);
    await denied("request_deletion", {});
    await rpc("request_deletion", { confirmation: "DELETE" });
    equal(!!(await rpc("account")).deletion_requested_at, true);
    await denied("plan_list");
    await rpc("cancel_deletion");
    await rpc("reactivate");
    await rpc("preferences", { email: true });
    equal((await rpc("account")).notification_preferences.email, true);
    await denied("preferences", { is_admin: true });
    equal((await rpc("export")).profile.id, ids.b);
    await assert.rejects(db.exec("select * from public.future_maps"));
    count++;
    await as("admin");
    await denied("deactivate");
    await as("");
    await denied("plan_list");
    console.log(`PASS: ${count} planning/account PostgreSQL assertions.`);
    if (extra) await extra({ db, ids, as, handler, request, apiMocks });
  });
}
module.exports = { runRoadmap };
if (require.main === module)
  runRoadmap().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
