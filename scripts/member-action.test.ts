import test from "node:test";
import assert from "node:assert/strict";
import { runMemberAction } from "../src/lib/discovery/member-action";

function fixture() {
  const events: unknown[] = [];
  const pending = new Set<string>();
  return { events, options: {
    key: "shortlist-member", pending,
    authenticate: async () => "owner",
    perform: async (id: string) => { events.push(["write", id]); },
    onSuccess: () => { events.push("success"); },
    onError: (message: string) => { events.push(["error", message]); },
    onBusy: (busy: boolean) => { events.push(["busy", busy]); },
  } };
}
test("only confirms success after persistence and releases the busy state", async () => {
  const { events, options } = fixture();
  await runMemberAction(options);
  assert.deepEqual([...events], [["busy", true], ["write", "owner"], "success", ["busy", false]]);
  assert.equal(options.pending.size, 0);
});
test("expired sessions provide feedback without persisting or changing member state", async () => {
  const { events, options } = fixture();
  await runMemberAction({ ...options, authenticate: async () => undefined });
  assert.deepEqual([...events], [["busy", true], ["error", "Your session has expired. Please sign in again."], ["busy", false]]);
  assert.equal(options.pending.size, 0);
});
test("handles auth failures and plain PostgREST errors, allowing retry", async () => {
  for (const stage of ["authenticate", "perform"] as const) {
    const { events, options } = fixture();
    await runMemberAction({ ...options, [stage]: async () => { throw { message: "Request denied" }; } });
    assert.deepEqual([...events], [["busy", true], ["error", "Request denied"], ["busy", false]]);
    await runMemberAction(options);
    assert.ok(events.includes("success"));
  }
});
test("duplicate clicks share a lock before authentication resolves", async () => {
  const { events, options } = fixture();
  let release!: (id: string) => void;
  const auth = new Promise<string>((resolve) => { release = resolve; });
  const first = runMemberAction({ ...options, authenticate: () => auth });
  await runMemberAction(options);
  assert.deepEqual([...events], [["busy", true]]);
  release("owner");
  await first;
  assert.equal(events.filter((e) => e === "success").length, 1);
});
test("unrelated members can be updated independently and unknown errors are readable", async () => {
  const { events, options } = fixture();
  await Promise.all([runMemberAction(options), runMemberAction({ ...options, key: "interest-other", perform: async () => { throw null; } })]);
  assert.ok(events.includes("success"));
  assert.ok(events.some((e) => Array.isArray(e) && e[0] === "error" && e[1] === "Please try again."));
  assert.equal(options.pending.size, 0);
});
