import { randomBytes, randomInt, createHash } from "node:crypto";
// Isolated development transport. No SMS delivery or official identity claim.
export class InviteProof {
  codes = new Map();
  proofs = new Map();
  files = new Map();
  send(token, phone, now = Date.now()) {
    if (!/^1[3-9]\d{9}$/.test(phone || "")) throw Error("请输入有效手机号。");
    const key = token + ":" + phone,
      old = this.codes.get(key);
    if (old && now - old.sent < 60000) throw Error("请稍后再获取验证码。");
    const code = String(randomInt(100000, 1000000));
    this.codes.set(key, {
      token,
      phone,
      code,
      hash: createHash("sha256").update(code).digest("hex"),
      sent: now,
      expires: now + 300000,
      errors: 0,
    });
    return {
      ok: true,
      expiresAt: new Date(now + 300000).toISOString(),
      message: "验证码已生成。",
    };
  }
  verify(token, phone, code, now = Date.now()) {
    const key = token + ":" + phone,
      c = this.codes.get(key);
    if (!c || c.expires <= now || c.errors >= 5)
      throw Error("验证码已过期，请重新获取。");
    if (c.hash !== createHash("sha256").update(String(code)).digest("hex")) {
      c.errors++;
      throw Error("验证码不正确，请重新输入。");
    }
    this.codes.delete(key);
    const proof = randomBytes(24).toString("hex");
    this.proofs.set(proof, { token, phone, expires: now + 1800000 });
    return { proof, phone };
  }
  check(token, proof, now = Date.now()) {
    const p = this.proofs.get(proof);
    if (!p || p.token !== token || p.expires <= now)
      throw Error("请先验证手机号。");
    return p;
  }
  inbox(tokens, now = Date.now()) {
    return [...this.codes.values()]
      .filter((c) => tokens.includes(c.token) && c.expires > now)
      .map(({ phone, code, expires }) => ({
        phone,
        code,
        expiresAt: new Date(expires).toISOString(),
      }));
  }
}
