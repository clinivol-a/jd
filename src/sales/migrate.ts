import type { SalesData } from "./model";
/** Versioned synthetic fixture migration; never clears user actions or replays transitions. */
export function migrateSales(input: SalesData): SalesData {
  const data = structuredClone(input) as SalesData & {
    fixtureRevision?: number;
  };
  if (data.fixtureRevision === 2) return data;
  const names = ["林致远", "周明哲", "许文博", "方景行", "陆承安", "徐嘉宁"];
  const legacy = ["林医生", "周医生", "许医生", "方医生", "陆医生", "徐医生"];
  data.hospitals.forEach((h) => {
    h.name = h.name.replace(/（虚构）$/, "");
  });
  data.doctors.forEach((d) => {
    const i = legacy.indexOf(d.name);
    if (i >= 0 && d.id === "D-" + (i + 1)) d.name = names[i];
  });
  for (const order of data.orders) {
    if (
      !/^SO-\d{4}-\d{4}$/.test(order.id) ||
      data.events.some((e) => e.target === order.id)
    )
      continue;
    data.events.push({
      id: "sales-fixture-created:" + order.id,
      at: order.created,
      actor: "业务资料导入",
      target: order.id,
      title: "订单已创建",
      detail: order.name,
      read: true,
    });
    if (order.status !== "草稿")
      data.events.push({
        id: "sales-fixture-state:" + order.id,
        at: order.updated,
        actor: "业务资料导入",
        target: order.id,
        title: "订单" + order.status,
        detail: order.name,
        read: false,
      });
  }
  data.events.sort(
    (a, b) =>
      new Date(b.at).getTime() - new Date(a.at).getTime() ||
      a.id.localeCompare(b.id),
  );
  data.fixtureRevision = 2;
  return data;
}
