import test from "node:test";
import assert from "node:assert/strict";
import { InviteProof } from "../server/sales-invite-proof.mjs";
test("invitation OTP expires, scopes identity, rate limits, prevents replay and caps attempts", () => {
  const s = new InviteProof(),
    now = Date.now();
  assert.throws(() => s.send("a", "123", now));
  s.send("a", "13900008882", now);
  assert.throws(() => s.send("a", "13900008882", now + 1));
  const code = s.inbox(["a"], now)[0].code;
  assert.equal(s.inbox(["b"], now).length, 0);
  assert.throws(() => s.verify("b", "13900008882", code, now));
  const { proof } = s.verify("a", "13900008882", code, now);
  assert.equal(s.check("a", proof, now).phone, "13900008882");
  assert.throws(() => s.check("b", proof, now));
  assert.throws(() => s.verify("a", "13900008882", code, now));
  assert.throws(() => s.check("a", proof, now + 1800001));
  s.send("a", "13900008882", now + 60001);
  assert.throws(() => s.verify("a", "13900008882", "wrong", now + 360002));
  s.send("a", "13900008882", now + 400000);
  for (let i = 0; i < 5; i++)
    assert.throws(() => s.verify("a", "13900008882", "wrong", now + 400001));
  const final = s.inbox(["a"], now + 400002)[0].code;
  assert.throws(() => s.verify("a", "13900008882", final, now + 400002));
});
