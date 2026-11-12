import test from "node:test";
import assert from "node:assert/strict";
import { seedSales, transition } from "../src/sales/model.ts";
import { migrateSales } from "../src/sales/migrate.ts";
import { orderErrors, localDate } from "../src/sales/orderRules.mjs";
const now = new Date("2026-11-11T12:00:00");
function setup() {
  const data = migrateSales(seedSales("li", now));
  return {
    data,
    order: {
      ...data.orders[3],
      id: "V22-ORDER",
      plannedStages: ["三维重建", "CAD设计"],
      clinicalRequirements: "评估骨缺损和神经管关系。",
      designRequirements: "预留固定孔位。",
      due: "2026-11-20",
      materials: [
        {
          id: "series",
          name: "series.nii.gz",
          size: 50,
          type: "application/gzip",
          category: "imaging",
          status: "success",
          storage: "browser",
        },
      ],
    },
  };
}
test("clinical and design requirements persist independently; case identity cannot be replaced", () => {
  const { data, order } = setup();
  const saved = transition(
    data,
    { type: "order-save", value: order },
    false,
    now,
  );
  assert.equal(
    saved.orders.at(-1).clinicalRequirements,
    order.clinicalRequirements,
  );
  assert.equal(
    saved.orders.at(-1).designRequirements,
    order.designRequirements,
  );
  assert.throws(() =>
    transition(
      saved,
      {
        type: "case-fill",
        value: { id: order.caseId, patientName: "另一个姓名" },
      },
      false,
      now,
    ),
  );
  assert.deepEqual(saved.cases, data.cases);
});
test("submission rejects past/today/invalid dates, CAD without upstream and filename-only uploads", () => {
  const { data, order } = setup();
  const name = data.cases.find((c) => c.id === order.caseId).patientName;
  assert.deepEqual(orderErrors(order, name, now), {});
  for (const due of ["2026-11-10", localDate(now), "2026-02-30"]) {
    assert.ok(orderErrors({ ...order, due, requestedDueDate: due }, name, now).due);
    const d = transition(
      data,
      { type: "order-save", value: { ...order, due, requestedDueDate: due } },
      false,
      now,
    );
    assert.throws(() =>
      transition(d, { type: "order-submit", target: order.id }, false, now),
    );
  }
  assert.ok(
    orderErrors({ ...order, plannedStages: ["CAD设计"] }, name, now)
      .plannedStages,
  );
  assert.ok(
    orderErrors({ ...order, materials: [{ name: "fake.dcm" }] }, name, now)
      .materials,
  );
  assert.ok(orderErrors(order, "", now).patientName);
});
test("one case may serve multiple orders; acceptance remains isolated and assigns a team before starting", () => {
  let { data, order } = setup();
  data = transition(data, { type: "order-save", value: order }, false, now);
  data = transition(
    data,
    { type: "order-submit", target: order.id },
    false,
    now,
  );
  assert.equal(data.orders.at(-1).status, "待审核");
  assert.equal(
    data.projects.some((p) => p.orderId === order.id),
    false,
  );
  data = transition(
    data,
    { type: "order-advance", target: order.id, value: "处理中" },
    true,
    now,
  );
  const accepted = data.orders.find((o) => o.id === order.id),
    project = data.projects.find((p) => p.id === accepted.projectId);
  assert.equal(project.source, "isolated-sales");
  assert.equal(project.orderId, order.id);
  assert.ok(accepted.stages[0].owner);
  assert.equal(accepted.stages[1].status, "未开始");
  assert.equal(
    data.events.filter((e) => e.target === order.id && e.title.includes("已完成")).length,
    0,
  );
  const another = { ...order, id: "V22-SECOND" };
  data = transition(data, { type: "order-save", value: another }, false, now);
  assert.equal(
    data.orders.filter((o) => o.caseId === order.caseId).length >= 2,
    true,
  );
});
test("ordinary sales cannot create historical access requests; migration preserves user records", () => {
  const { data } = setup();
  assert.throws(() =>
    transition(
      data,
      {
        type: "request",
        value: {
          id: "bad",
          kind: "历史访问",
          target: data.orders.at(-1).id,
          reason: "查看",
        },
      },
      false,
      now,
    ),
  );
  const old = { ...data, fixtureRevision: 3 };
  old.orders[0].clinicalRequirements = undefined;
  old.orders[0].requirements = "已填写的原始临床要求";
  const next = migrateSales(old);
  assert.equal(next.orders[0].clinicalRequirements, "已填写的原始临床要求");
  assert.deepEqual(next.doctors, old.doctors);
  assert.deepEqual(next.events, old.events);
  assert.deepEqual(migrateSales(next), next);
});
test("local service independently rejects unauthenticated, mismatched-owner, past-date and ungranted history requests", async () => {
  const http = await import("node:http");
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { pathToFileURL } = await import("node:url");
  const { salesDemoPlugin } = await import("../server/sales-demo.mjs");
  const dir = await mkdtemp(tmpdir() + "/clinivol-order-v22-");
  const auth = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        user:
          req.headers.cookie === "sales"
            ? { id: "li", role: "sales", permissions: [] }
            : null,
      }),
    );
  });
  await new Promise((r) => auth.listen(0, "127.0.0.1", r));
  let middleware;
  const plugin = salesDemoPlugin(
    "http://127.0.0.1:" + auth.address().port,
    pathToFileURL(dir + "/data.json"),
  );
  await plugin.configureServer({
    config: { server: { port: 0, host: "127.0.0.1" } },
    middlewares: { use: (fn) => (middleware = fn) },
  });
  const server = http.createServer(
    (req, res) => void middleware(req, res, () => res.end()),
  );
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const post = (route, body, cookie = "sales") =>
    fetch(
      "http://127.0.0.1:" + server.address().port + "/api/sales-demo/" + route,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify(body),
      },
    );
  try {
    const { order } = setup();
    order.due = "2999-12-20"; order.requestedDueDate = order.due;
    assert.equal(
      (
        await post(
          "order-validate",
          { ownerId: "li", order, patientName: "合成患者" },
          "",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await post("order-validate", {
          ownerId: "other",
          order,
          patientName: "合成患者",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await post("order-validate", {
          ownerId: "li",
          order,
          patientName: "合成患者",
        })
      ).status,
      200,
    );
    const response = await post("order-validate", {
      ownerId: "li",
      order: { ...order, due: "2000-01-01", requestedDueDate: "2000-01-01" },
      patientName: "合成患者",
    });
    assert.equal(response.status, 422);
    assert.ok((await response.json()).errors.due);
    assert.equal(
      (await post("order-history-request", { orderId: "old" })).status,
      403,
    );
  } finally {
    server.closeAllConnections();
    auth.closeAllConnections();
    await Promise.all([
      new Promise((r) => server.close(r)),
      new Promise((r) => auth.close(r)),
    ]);
    await rm(dir, { recursive: true, force: true });
  }
});
