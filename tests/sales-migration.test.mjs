import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../scripts/load-ts.mjs";
const { seedSales } = loadTs("src/sales/model.ts"),
  { migrateSales } = loadTs("src/sales/migrate.ts");
test("fixture migration is idempotent and preserves existing actions, attachments, IDs and custom people", () => {
  const d = seedSales("li", new Date("2026-11-10T10:00:00"));
  d.events.push({
    id: "actual",
    at: "2026-11-10T09:00:00Z",
    actor: "真实操作人",
    target: d.orders[0].id,
    title: "跟进",
    detail: "已有记录",
    read: true,
  });
  d.doctors.push({
    ...d.doctors[0],
    id: "user-doctor",
    name: "方医生",
    materials: [{ id: "blob" }],
  });
  const result = migrateSales(d);
  assert.deepEqual(
    result.events.find((e) => e.id === "actual"),
    d.events[0],
  );
  assert.equal(result.doctors.at(-1).name, "方医生");
  assert.equal(result.doctors.at(-1).materials[0].id, "blob");
  assert.equal(result.doctors[0].name, "林致远");
  assert.deepEqual(migrateSales(result), result);
  assert.equal(
    new Set(result.events.map((e) => e.id)).size,
    result.events.length,
  );
  assert.ok(result.events.length > 1);
  assert.equal(
    result.events.filter((e) => e.target === d.orders[0].id).length,
    1,
  );
});
test('V2 statuses migrate without rewriting audit actors, timestamps, ownership or attachments',()=>{
 const d=seedSales('li',new Date('2026-11-10T10:00:00'));d.fixtureRevision=2;
 d.orders[0].status='待受理';d.orders[1].status='待补资料';d.orders[2].status='待客户确认';
 d.events=[{id:'immutable',at:'2026-10-01T08:00:00Z',actor:'已记录审核人',title:'历史审核',target:d.orders[0].id,detail:'保留原文',read:true}];
 d.orders[1].materials=[{id:'existing-real-blob',name:'retained.pdf'}];
 const result=migrateSales(d);assert.equal(result.orders[0].status,'待审核');assert.equal(result.orders[1].status,'审核退回');assert.equal(result.orders[2].status,'处理中');assert.equal(result.orders[2].confirmationRequired,true);
 assert.deepEqual(result.events.find(e=>e.id==='immutable'),d.events[0]);assert.deepEqual(result.orders[1].materials,d.orders[1].materials);
 assert.equal(new Set(result.projects.map(p=>p.id)).size,result.projects.length);assert.deepEqual(migrateSales(result),result);
});
