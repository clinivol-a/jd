import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { salesDemoPlugin } from "../server/sales-demo.mjs";
test("local invitation transport scopes sales sessions, validates source and queues leads without granting ownership", async () => {
  const dir = await mkdtemp(tmpdir() + "/clinivol-sales-");
  let middleware;
  const auth = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        user:
          req.headers.cookie === "sales"
            ? { id: "li", name: "李明", role: "sales" }
            : null,
      }),
    );
  });
  await new Promise((r) => auth.listen(0, "127.0.0.1", r));
  const plugin = salesDemoPlugin(
    "http://127.0.0.1:" + auth.address().port,
    pathToFileURL(dir + "/invites.json"),
  );
  const config = { server: { port: 0, host: "127.0.0.1" } };
  await plugin.configureServer({
    config,
    middlewares: { use: (fn) => (middleware = fn) },
  });
  const server = http.createServer(
    (req, res) =>
      void middleware(req, res, () => {
        res.statusCode = 404;
        res.end();
      }),
  );
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  config.server.port = server.address().port;
  const base = "http://127.0.0.1:" + config.server.port + "/api/sales-demo/";
  const post = (path, body, cookie = "sales", origin) =>
    fetch(base + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
        ...(origin ? { origin } : {}),
      },
      body: JSON.stringify(body),
    });
  try {
    assert.equal((await fetch(base + "leads")).status, 403);
    const issued = await (
      await post("invite", {
        hospitals: [{ id: "h", name: "虚构医院", departments: ["口腔科"] }],
      })
    ).json();
    assert.equal(issued.lan, false);
    const token = new URL(issued.url).searchParams.get("token");
    assert.equal(
      (
        await post(
          "public?token=" + token,
          { name: "合成医生", hospitalId: "outside", department: "口腔科" },
          "",
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await post(
          "public?token=" + token,
          { name: "合成医生", hospitalId: "h", department: "口腔科" },
          "",
          "https://outside.test",
        )
      ).status,
      403,
    );
    const result = await post(
      "public?token=" + token,
      { name: "合成医生", hospitalId: "h", department: "口腔科" },
      "",
    );
    assert.equal(result.status, 200);
    const list = await (
      await fetch(base + "leads", { headers: { cookie: "sales" } })
    ).json();
    assert.equal(list.leads.length, 1);
    assert.equal(list.leads[0].owner, "li");
    assert.equal(list.leads[0].code, issued.code);
    assert.equal(list.leads[0].status, undefined);
    assert.equal(plugin.apply, "serve");
  } finally {
    await new Promise((r) => server.close(r));
    await new Promise((r) => auth.close(r));
    await rm(dir, { recursive: true, force: true });
  }
});
