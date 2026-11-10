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
    materials: [
      { id: "file", name: "qual.pdf", size: 10, type: "application/pdf" },
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
  d = transition(
    d,
    { type: "order-advance", target: "NEW", value: "待客户确认" },
    true,
    now,
  );
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
    o = d.orders.find((o) => o.status === "待受理");
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
