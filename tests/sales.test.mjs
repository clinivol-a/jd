import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../scripts/load-ts.mjs";
const { seedSales, transition, canReadOrder, visibleOrders, metrics } =
  loadTs("src/sales/model.ts");
const now = new Date("2026-11-09T12:00:00");
test("five card queries derive from visible records; another owner has an isolated dataset", () => {
  const d = seedSales("li", now),
    m = metrics(d, now);
  assert.equal(
    m.active.length,
    visibleOrders(d, now).filter(
      (o) => !["草稿", "已完成", "已取消"].includes(o.status),
    ).length,
  );
  assert.equal(m.doctors.length, 2);
  assert.notEqual(seedSales("another", now).ownerId, d.ownerId);
});
test("3/6 month rolling visibility and grants are enforced on direct detail access", () => {
  let d = seedSales("li", now);
  const old = d.orders.at(-2);
  assert.equal(canReadOrder(d, old, now), false);
  d.policy.months = 6;
  assert.equal(canReadOrder(d, old, now), true);
  d.policy.months = 3;
  d = transition(
    d,
    {
      type: "request",
      value: {
        id: "req",
        kind: "历史访问",
        target: old.id,
        reason: "跟进未完结订单",
      },
    },
    false,
    now,
  );
  assert.throws(() =>
    transition(
      d,
      { type: "request-review", target: "req", value: "通过" },
      false,
      now,
    ),
  );
  d = transition(
    d,
    { type: "request-review", target: "req", value: "通过" },
    true,
    now,
  );
  assert.equal(canReadOrder(d, old, now), true);
  assert.equal(canReadOrder(d, old, new Date(now.getTime() + 86400001)), false);
});
test("doctor draft, upload metadata, submission, admin return/resubmit/pass and unique owner", () => {
  let d = seedSales("li", now);
  const doctor = {
    ...d.doctors[4],
    name: "新增医生",
    certificate: "SYN-001",
    phone: "13900008881",
    title: "主任医师",
    materials: [
      {
        id: "identity",
        name: "id.png",
        size: 10,
        type: "image/png",
        category: "identity",
      },
      {
        id: "file",
        name: "qual.pdf",
        size: 10,
        type: "application/pdf",
        category: "practice",
      },
    ],
  };
  d = transition(d, { type: "doctor-save", value: doctor }, false, now);
  d = transition(d, { type: "doctor-submit", target: doctor.id }, false, now);
  assert.throws(() =>
    transition(
      d,
      { type: "doctor-review", target: doctor.id, value: "审核通过" },
      false,
      now,
    ),
  );
  d = transition(
    d,
    {
      type: "doctor-review",
      target: doctor.id,
      value: "审核退回",
      reason: "需补件",
    },
    true,
    now,
  );
  d = transition(d, { type: "doctor-submit", target: doctor.id }, false, now);
  d = transition(
    d,
    { type: "doctor-review", target: doctor.id, value: "审核通过" },
    true,
    now,
  );
  assert.equal(d.doctors.find((x) => x.id === doctor.id).owner, "li");
  assert.throws(() =>
    transition(
      d,
      { type: "doctor-save", value: { ...d.doctors[5] } },
      false,
      now,
    ),
  );
  assert.equal(d.events.length, 5);
});
test("order draft-submit-accept-stage-confirm-complete, no shortcuts and no fabricated future events", () => {
  let d = seedSales("li", now);
  let o = {
    ...d.orders[3],
    id: "NEW",
    service: "手术导板设计",
    materials: [
      { id: "file", name: "clinical.pdf", size: 10, type: "application/pdf" },
    ],
  };
  d = transition(d, { type: "order-save", value: o }, false, now);
  d = transition(d, { type: "order-submit", target: "NEW" }, false, now);
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: "NEW", value: "处理中" },
      false,
      now,
    ),
  );
  d = transition(
    d,
    { type: "order-advance", target: "NEW", value: "处理中" },
    true,
    now,
  );
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: "NEW", value: "已完成" },
      true,
      now,
    ),
  );
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: "NEW", value: "待客户确认" },
      true,
      now,
    ),
  );
  d = transition(d, { type: "order-stage", target: "NEW" }, true, now);
  d = transition(d, { type: "order-stage", target: "NEW" }, true, now);
  d = transition(d, { type: "order-confirm", target: "NEW" }, true, now);
  d = transition(
    d,
    { type: "order-advance", target: "NEW", value: "已完成" },
    true,
    now,
  );
  assert.equal(d.orders.find((o) => o.id === "NEW").status, "已完成");
  assert.equal(
    metrics(d, now).completed.some((o) => o.id === "NEW"),
    true,
  );
  assert.equal(d.events.filter((e) => e.target === "NEW").length, 7);
});
test("unauthorized hospital, duplicate doctor phone and restricted order writes fail", () => {
  const d = seedSales("li", now);
  assert.throws(() =>
    transition(
      d,
      { type: "doctor-save", value: { ...d.doctors[4], hospitalId: "OTHER" } },
      false,
      now,
    ),
  );
  const order = d.orders.at(-2);
  assert.throws(() =>
    transition(d, { type: "order-save", value: order }, false, now),
  );
  assert.throws(() =>
    transition(
      d,
      { type: "followup", target: order.id, reason: "no" },
      false,
      now,
    ),
  );
});
test("assignment request does not overwrite ownership before approval", () => {
  let d = seedSales("li", now);
  d = transition(
    d,
    {
      type: "request",
      value: {
        id: "move",
        kind: "归属变更",
        target: d.doctors[5].id,
        reason: "区域调整",
      },
    },
    false,
    now,
  );
  assert.equal(d.doctors[5].owner, "other-sales");
  d = transition(
    d,
    { type: "request-review", target: "move", value: "通过" },
    true,
    now,
  );
  assert.equal(d.doctors[5].owner, "li");
  assert.equal(d.requests[0].oldOwner, "other-sales");
});
test("calendar months use local dates at the UTC month boundary", () => {
  const boundary = new Date("2026-11-01T00:15:00");
  let d = seedSales("li", boundary);
  d.orders[0].created = boundary.toISOString();
  assert.equal(
    metrics(d, boundary).newOrders.some((o) => o.id === d.orders[0].id),
    true,
  );
});
test("administrator rejection requires a reason and sales cannot cancel", () => {
  const d = seedSales("li", now),
    o = d.orders.find((o) => o.status === "待审核");
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: o.id, value: "已取消" },
      false,
      now,
    ),
  );
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: o.id, value: "已取消" },
      true,
      now,
    ),
  );
  assert.equal(
    transition(
      d,
      {
        type: "order-advance",
        target: o.id,
        value: "已取消",
        reason: "需重新确认服务范围",
      },
      true,
      now,
    ).orders.find((x) => x.id === o.id).status,
    "已取消",
  );
});
test("permission grants are scoped per action, self approval and wrong account fail", () => {
  let d = seedSales("li", now);
  d = transition(
    d,
    {
      type: "request",
      value: {
        id: "r",
        kind: "历史访问",
        target: d.orders.at(-2).id,
        reason: "查阅",
      },
    },
    false,
    now,
  );
  const c = { type: "request-review", target: "r", value: "通过" };
  assert.throws(() =>
    transition(
      d,
      c,
      { id: "li", permissions: ["doctor.assignment.review"] },
      now,
    ),
  );
  assert.throws(() =>
    transition(d, c, { id: "li", permissions: ["order.history.review"] }, now),
  );
  assert.throws(() =>
    transition(
      d,
      c,
      { id: "intruder", permissions: ["order.history.review"] },
      now,
    ),
  );
  // Manager dataset contains only granted applicant requests, self-review remains blocked.
  d.requests[0].applicant = "subordinate";
  const approved = transition(
    d,
    c,
    { id: "li", name: "主管", permissions: ["order.history.review"] },
    now,
  );
  assert.equal(approved.requests[0].reviewer, "li");
  assert.equal(approved.events[0].actor, "主管");
  assert.throws(() =>
    transition(
      d,
      { ...c, value: "退回" },
      { id: "li", permissions: ["order.history.review"] },
      now,
    ),
  );
});
test("doctor reassignment does not rewrite historical order owner or ID associations", () => {
  let d = seedSales("li", now);
  d.orders[0].ownerSalesId = "li";
  const o = structuredClone(d.orders[0]);
  d.requests.push({
    id: "transfer",
    target: o.doctorId,
    kind: "归属变更",
    reason: "区域调整",
    applicant: "other",
    newOwner: "other",
    oldOwner: "li",
    status: "待审核",
    at: now.toISOString(),
  });
  d = transition(
    d,
    { type: "request-review", target: "transfer", value: "通过" },
    true,
    now,
  );
  assert.equal(d.doctors.find((x) => x.id === o.doctorId).owner, "other");
  assert.deepEqual(d.orders[0], o);
  assert.ok(canReadOrder(d, d.orders[0], now));
});
test("incomplete draft is saved but atomic submit fails without partial state", () => {
  const d = seedSales("li", now),
    doctor = {
      ...d.doctors[4],
      id: "draft",
      phone: "",
      hospitalId: "",
      department: "",
      certificate: "",
      materials: [],
    };
  const saved = transition(
    d,
    { type: "doctor-save", value: doctor },
    false,
    now,
  );
  assert.equal(saved.doctors.at(-1).status, "草稿");
  assert.throws(() =>
    transition(d, { type: "doctor-save-submit", value: doctor }, false, now),
  );
  assert.equal(
    d.doctors.some((x) => x.id === "draft"),
    false,
  );
});
test("six order states; acceptance creates stable project/task IDs; completion requires confirmation", () => {
  let d = seedSales("li", now);
  let o = {
    ...d.orders[3],
    id: "order-closed-loop",
    service: "手术导板设计",
    materials: [{ id: "proof" }],
  };
  d = transition(d, { type: "order-save", value: o }, false, now);
  d = transition(d, { type: "order-submit", target: o.id }, false, now);
  d = transition(
    d,
    { type: "order-advance", target: o.id, value: "处理中" },
    true,
    now,
  );
  const saved = d.orders.find((x) => x.id === o.id);
  assert.equal(saved.projectId, "SP-" + o.id);
  assert.equal(saved.taskIds.length, 2);
  assert.equal(d.projects[0].caseId, o.caseId);
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: o.id, value: "已完成" },
      true,
      now,
    ),
  );
  d = transition(d, { type: "order-stage", target: o.id }, true, now);
  d = transition(d, { type: "order-stage", target: o.id }, true, now);
  assert.throws(() =>
    transition(
      d,
      { type: "order-advance", target: o.id, value: "已完成" },
      true,
      now,
    ),
  );
  d = transition(d, { type: "order-confirm", target: o.id }, true, now);
  d = transition(
    d,
    { type: "order-advance", target: o.id, value: "已完成" },
    true,
    now,
  );
  assert.equal(d.orders.find((x) => x.id === o.id).status, "已完成");
  assert.equal(d.projects.length, 1);
  assert.equal(new Set(saved.taskIds).size, 2);
  assert.equal(
    d.events.some((e) => e.title.includes("等待解锁")),
    false,
  );
});
