import {dashboardOrderBuckets,salesBusiness} from "./dashboardBusiness.mjs";
import { addOrderScenario } from "./orderFixtures.mjs";
import { ChevronLeftIcon, ChevronRightIcon } from "../design-system/tdesign";
import { SalesAttachments } from "./SalesAttachments";
import { OrderEditor, OrderDetail, OrderIcons } from "./OrderPages";
import { confirmedDelivery, localDate } from "./orderRules.mjs";
import { RangeControl } from "../projects/RangeControl";
import { migrateSales } from "./migrate";
import { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  Dialog,
  Drawer,
  Empty,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Tabs,
  Pagination,
  DatePicker,
  DateRangePicker,
  Menu,
  MessagePlugin,
  Tooltip,
} from "tdesign-react";
import {
  HomeIcon,
  TaskIcon,
  UserBusinessIcon,
  UserCircleIcon,
  FileIcon,
  ListDemandIcon,
  NotificationIcon,
  TaskFilledIcon,
  WorkFilledIcon,
  TimeFilledIcon,
  FileAddFilledIcon,
  TaskCheckedFilledIcon,
  MenuFoldIcon,
  MenuUnfoldIcon,
} from "../design-system/tdesign";
import { GlobalHeader, SettingsPage } from "../App";
import { useAuth, useWorkspaceStorage } from "../auth/AuthContext";
import { roleName } from "../auth/AccountMenu";
import { formatAuditTime, formatDynamicTime, formatDate, formatDateTime } from "../dateTime";
import {
  seedSales,
  transition,
  metrics,
  visibleOrders,
  canReadOrder,
  services,
  orderStatuses,
  id,
  localMonth,
} from "./model";
import type {
  SalesData,
  Doctor,
  Order,
  Command,
  Request as SalesRequest,
} from "./model";
import "./sales.css";
import { SalesInviteDialog, readInviteLeads } from "./SalesInvite";
type Row = Record<string, unknown>;
const allFilterValue = (value: unknown) => value === "__all__" ? "" : String(value || "");
const settings = ["profile", "security", "preferences"] as const;
const statusTheme = (s: string) =>
  s.includes("退回") || s === "审核退回"
    ? "danger"
    : (s.includes("审核") && s !== "审核通过") || ["待审核"].includes(s)
      ? "warning"
      : s === "已完成" || s === "审核通过" || s === "通过"
        ? "success"
        : s === "处理中"
          ? "primary"
          : "default";
function Status({ value }: { value: string }) {
  return (
    <Tag
      theme={statusTheme(value)}
      variant="light"
      className={
        value === "处理中" || value === "进行中"
          ? "status-in-progress"
          : undefined
      }
    >
      {value}
    </Tag>
  );
}
function Grid({
  rows,
  fields,
  paginate = true,
  savedPage,
  onPage,
  pageSize = 6,
  orderMode = false,
  highlight,
}: {
  savedPage?: number;
  pageSize?: number;
  orderMode?: boolean;
  highlight?: string;
  onPage?: (page: number) => void;
  rows: Row[];
  paginate?: boolean;
  fields: {
    key: string;
    label: string;
    render?: (row: Row) => React.ReactNode;
  }[];
}) {
  const [localPage, setLocalPage] = useState(1);
  const page = Math.max(
    1,
    Math.min(savedPage ?? localPage, Math.ceil(rows.length / pageSize) || 1),
  );
  const setPage = (value: number) => {
    setLocalPage(value);
    onPage?.(value);
  };
  const rowIdentity = rows.map((r) => String(r.id)).join("|");
  const previousRows = useRef(rowIdentity);
  useEffect(() => {
    if (previousRows.current !== rowIdentity) {
      setPage(1);
      previousRows.current = rowIdentity;
    }
  }, [rowIdentity]);
  const width = (key: string) =>
    ({
      id: 150,
      name: 180,
      hospitalId: 180,
      doctorId: 100,
      service: 170,
      status: 115,
      actions: orderMode ? 150 : 110,
      created: orderMode ? 180 : 130,
      updated: orderMode ? 180 : 140,
      due: 130,
    })[key] || 120;
  return (
    <div className="sales-table-scroll">
      <Table
        tableContentWidth={
          "max(100%, " +
          fields.reduce((sum, c) => sum + width(c.key), 0) +
          "px)"
        }
        className={orderMode ? "app-table project-data-table" : "app-table"}
        rowClassName={({ row }) =>
          orderMode && row.id === highlight ? "sales-order-submitted" : ""
        }
        size={orderMode ? "medium" : "small"}
        hover
        bordered={false}
        tableLayout="fixed"
        rowKey="id"
        data={
          paginate ? rows.slice((page - 1) * pageSize, page * pageSize) : rows
        }
        columns={fields.map((c) => ({
          colKey: c.key,
          title: c.label,
          width: width(c.key),
          align: "left" as const,
          ellipsis: c.key !== "actions",
          fixed:
            c.key === "actions"
              ? "right"
              : (orderMode && ["id", "hospitalId", "name"].includes(c.key)) ||
                  (c.key === "id" && fields[0]?.key === "id")
                ? "left"
                : undefined,
          cell: c.render
            ? ({ row }: { row: Row }) => c.render!(row)
            : undefined,
        }))}
        pagination={
          paginate && !orderMode
            ? {
                current: page,
                pageSize: 6,
                total: rows.length,
                showJumper: false,
                showPageSize: false,
                onCurrentChange: setPage,
              }
            : undefined
        }
        empty={<Empty description={orderMode ? undefined : "暂无符合条件的记录"} />}
      />
      {paginate && orderMode && (
        <div className="project-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={rows.length}
            showPageSize={false}
            onCurrentChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
export default function SalesWorkspace() {
  const auth = useAuth(),
    account = auth.user!,
    storage = useWorkspaceStorage();
  const [inviteCodes, setInviteCodes] = useState<
    { phone: string; code: string; expiresAt: string }[]
  >([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false),
    [noticeFilter, setNoticeFilter] = useState("全部");
  const [data, setData] = useState<SalesData>(() => {
    try {
      const d = JSON.parse(storage.getItem("sales-v1") || "null");
      if (d?.schema === 1 && d.ownerId === account.id) return migrateSales(d);
    } catch {}
    return migrateSales(seedSales(account.id));
  });
  useEffect(() => {
    try {
      // Re-read at mount/HMR so another open tab's newer schedule is not overwritten.
      const latest = JSON.parse(storage.getItem("sales-v1") || "null");
      const initial = latest?.schema === 1 && latest.ownerId === account.id ? migrateSales(latest) : data;
      storage.setItem("sales-v1", JSON.stringify(initial));
    } catch {
      void MessagePlugin.error("无法保存销售工作状态，请检查浏览器存储空间。");
    }
  }, [storage]);
  const [route, setRoute] = useState(() =>
    location.hash.startsWith("#sales/")
      ? location.hash.slice(7)
      : storage.getItem("sales-route") || "home",
  );
  const [collapsed, setCollapsed] = useState(
      () => storage.getItem("sales-collapsed") === "1",
    ),
    [dark, setDark] = useState(
      document.documentElement.getAttribute("theme-mode") === "dark",
    ),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState(""),
    [hospitalFilter, setHospitalFilter] = useState(""),
    [deptFilter, setDeptFilter] = useState(""),
    [serviceFilter, setServiceFilter] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [month, setMonth] = useState(localMonth(new Date()));
  const [listPages, setListPages] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(storage.getItem("sales-list-pages") || "{}");
    } catch {
      return {};
    }
  });
  const rememberPage = (key: string, page: number) =>
    setListPages((previous) => {
      const next = { ...previous, [key]: page };
      storage.setItem("sales-list-pages", JSON.stringify(next));
      return next;
    });
  const [keyword, setKeyword] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const reviewPermissions = account.permissions.filter((p) =>
    ["doctor.assignment.review", "order.history.review"].includes(p),
  );
  const canReview = reviewPermissions.length > 0;
  const [homeRange, setHomeRange] = useState<[string, string]>(() => {
    const end = new Date(),
      start = new Date();
    start.setMonth(start.getMonth() - 3);
    return [formatDate(start.toISOString()), formatDate(end.toISOString())];
  });
  const filterSignature = JSON.stringify([
    keyword,
    filter,
    hospitalFilter,
    deptFilter,
    serviceFilter,
    from,
    to,
  ]);
  const previousFilter = useRef({ route, signature: filterSignature });
  useEffect(() => {
    if (
      previousFilter.current.route === route &&
      previousFilter.current.signature !== filterSignature
    ) {
      const key = route.startsWith("customers")
        ? "doctors"
        : route.startsWith("orders")
          ? "orders"
          : "";
      if (key) rememberPage(key, 1);
    }
    previousFilter.current = { route, signature: filterSignature };
  }, [route, filterSignature]);
  const [highlightOrder, setHighlightOrder] = useState("");
  useEffect(() => {
    if (!highlightOrder) return;
    const timer = setTimeout(() => setHighlightOrder(""), 3500);
    return () => clearTimeout(timer);
  }, [highlightOrder]);
  const [itemCategory,setItemCategory]=useState("需要处理");
  const [itemSearch,setItemSearch]=useState("");
  const [itemKeyword,setItemKeyword]=useState("");
  const [itemType,setItemType]=useState("");
  const [itemDept,setItemDept]=useState("");
  const [itemStage,setItemStage]=useState("");
  const [itemDoctorStatus,setItemDoctorStatus]=useState("");
  const [itemStatus,setItemStatus]=useState("");
  const [itemFrom,setItemFrom]=useState("");
  const [itemTo,setItemTo]=useState("");
  useEffect(()=>{const timer=setTimeout(()=>setItemKeyword(itemSearch.trim()),250);return ()=>clearTimeout(timer);},[itemSearch]);
  const [deleteOrderId, setDeleteOrderId] = useState("");
  const [deleteDoctorId,setDeleteDoctorId]=useState("");
  const [scenarioConfirm, setScenarioConfirm] = useState(false);
  const [modal, setModal] = useState(""),
    [reason, setReason] = useState(""),
    [target, setTarget] = useState(""),
    [testOpen, setTestOpen] = useState(false);
  const [noticePreferences, setNoticePreferences] = useState(() => {
    try {
      return (
        JSON.parse(storage.getItem("sales-notice-preferences") || "null") || {
          taskAssigned: true,
          reviewResult: true,
          doctorComments: true,
          systemMessages: false,
        }
      );
    } catch {
      return {
        taskAssigned: true,
        reviewResult: true,
        doctorComments: true,
        systemMessages: false,
      };
    }
  });
  useEffect(
    () =>
      storage.setItem(
        "sales-notice-preferences",
        JSON.stringify(noticePreferences),
      ),
    [noticePreferences, storage],
  );
  const commit = (c: Command, admin = false) => {
    try {
      if (admin && !import.meta.env.DEV)
        throw new Error("当前环境不允许测试审批。");
      const next = transition(
        data,
        c,
        admin
          ? true
          : {
              id: account.id,
              name: account.name,
              permissions: account.permissions,
            },
      );
      storage.setItem("sales-v1", JSON.stringify(next));
      setData(next);
      void MessagePlugin.success("操作已保存");
      return true;
    } catch (e) {
      void MessagePlugin.error((e as Error).message);
      return false;
    }
  };
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let alive = true;
    const sync = async () => {
      try {
        const leads = await readInviteLeads();
        if (!alive) return;
        setData((current) => {
          let next = current;
          for (const lead of leads) {
            const did = "D-LEAD-" + lead.id;
            const existing = next.doctors.find(
              (d) => d.id === did || (lead.phone && d.phone === lead.phone),
            );
            if (existing) {
              if (existing.owner && existing.owner !== account.id) continue;
              if (
                ["待审核", "审核通过"].includes(existing.status) ||
                (existing.updatedAt &&
                  new Date(existing.updatedAt) >= new Date(lead.at))
              )
                continue;
              next = transition(
                next,
                {
                  type: "doctor-save",
                  value: {
                    ...existing,
                    title: existing.title || lead.title || "",
                    certificate: existing.certificate || lead.certificate || "",
                    materials: [
                      ...existing.materials,
                      ...(lead.materials || []).filter(
                        (f) => !existing.materials.some((x) => x.id === f.id),
                      ),
                    ],
                    phoneVerified: lead.phoneVerified,
                  },
                },
                false,
                new Date(lead.at),
              );
              continue;
            }
            next = transition(
              next,
              {
                type: "doctor-save",
                value: {
                  id: did,
                  name: lead.name,
                  phone: lead.phone,
                  hospitalId: lead.hospitalId,
                  department: lead.department,
                  title: lead.title || "",
                  certificate: lead.certificate || "",
                  status: "草稿",
                  owner: null,
                  materials: lead.materials || [],
                  phoneVerified: lead.phoneVerified,
                  invitedBy: account.id,
                  reason: "",
                  source: lead.submissionMode === "sales-assisted" ? `销售协助建档 · ${lead.submittedBy || account.name}` : lead.code,
                },
              },
              false,
              new Date(lead.at),
            );
          }
          if (next !== current)
            storage.setItem("sales-v1", JSON.stringify(next));
          return next;
        });
      } catch {
        /* Invitation transport does not replace persisted customer data. */
      }
    };
    void sync();
    const timer = setInterval(() => void sync(), 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [storage]);
  const filterCache = useRef<
    Record<
      string,
      {
        search: string;
        filter: string;
        hospitalFilter: string;
        deptFilter: string;
        serviceFilter: string;
        from: string;
        to: string;
      }
    >
  >({});
  useEffect(() => {
    filterCache.current[route] = {
      search,
      filter,
      hospitalFilter,
      deptFilter,
      serviceFilter,
      from,
      to,
    };
  }, [
    route,
    search,
    filter,
    hospitalFilter,
    deptFilter,
    serviceFilter,
    from,
    to,
  ]);
  const go = (r: string) => {
    location.hash = "sales/" + r;
  };
  const openStat = (category: string) => {
    delete filterCache.current["orders/" + category];
    rememberPage("orders", 1);
    go("orders/" + category);
  };
  useEffect(() => {
    if (!location.hash.startsWith("#sales/"))
      history.replaceState(null, "", "#sales/" + route);
  }, []);
  useEffect(() => {
    const sync = () => {
      if (location.hash.startsWith("#sales/")) {
        setRoute(location.hash.slice(7));
        const state = filterCache.current[location.hash.slice(7)];
        setSearch(state?.search || "");
        setFilter(state?.filter || "");
        setHospitalFilter(state?.hospitalFilter || "");
        setDeptFilter(state?.deptFilter || "");
        setServiceFilter(state?.serviceFilter || "");
        setFrom(state?.from || "");
        setTo(state?.to || "");
      }
    };
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  useEffect(() => {
    storage.setItem("sales-route", route);
    storage.setItem("sales-collapsed", collapsed ? "1" : "0");
  }, [route, collapsed, storage]);
  const theme = (v: "light" | "dark" | "system") => {
    const d =
      v === "dark" ||
      (v === "system" && matchMedia("(prefers-color-scheme:dark)").matches);
    setDark(d);
    document.documentElement.setAttribute("theme-mode", d ? "dark" : "light");
    document.documentElement.dataset.theme = d ? "dark" : "light";
    localStorage.setItem("clinivol-theme-preference", v);
  };
  const user = {
    ...account,
    employeeId: account.employeeId || account.id,
    phone: account.phone.replace(/(\d{3})\d{4}/, "$1****"),
    role: roleName(account),
  };
  const m = metrics(data),
    orders = visibleOrders(data).sort(
      (a, b) => Date.parse(b.created) - Date.parse(a.created),
    ),
    h = (hid: string) => data.hospitals.find((h) => h.id === hid)?.name || "",
    doc = (did: string) => data.doctors.find((x) => x.id === did)?.name || "";
  const [section, detail, caseRoute] = route.split("/"),
    active =
      section === "hospital" ||
      section === "doctor" ||
      section === "doctor-new" ||
      section === "requests"
        ? "customers"
        : section === "order" ||
            section === "order-new" ||
            section === "case" ||
            section === "history"
          ? "orders"
          : section;
  const applyRequest = (kind: SalesRequest["kind"], tid: string) => {
    setTarget(tid);
    setModal(kind);
    setReason("");
  };
  const eventTarget = (target: unknown) => {
    const key = String(target);
    return data.requests.find((r) => r.id === key)?.target || key;
  };
  const eventSummary = (event: { target: unknown; detail?: unknown }) => {
    const key = eventTarget(event.target);
    return String(
      event.detail ||
        data.events.find(e=>e.target===key&&e.title==="订单草稿已删除")?.detail ||
        data.orders.find((o) => o.id === key)?.name ||
        data.doctors.find((d) => d.id === key)?.name ||
        key,
    );
  };
  const openEvent = (event: { id?: unknown; target: unknown }) => {
    if (event.id) commit({ type: "read", target: String(event.id) });
    const key = eventTarget(event.target);
    const order = data.orders.find((o) => o.id === key);
    if (!order && data.events.some(e=>e.target===key&&e.title==="订单草稿已删除")) { void MessagePlugin.info("订单草稿已删除，操作记录已保留。"); return; }
    go(
      order
        ? canReadOrder(data, order)
          ? "order/" + key
          : "history"
        : data.doctors.some((d) => d.id === key)
          ? "doctor/" + key
          : "customers/requests",
    );
  };
  const orderFields = [
    { key: "id", label: "订单编号" },
    { key: "name", label: "手术项目名称" },
    { key: "caseId", label: "病例编号" },
    {
      key: "hospitalId",
      label: "医院",
      render: (r: Row) => h(String(r.hospitalId)),
    },
    {
      key: "doctorId",
      label: "医生",
      render: (r: Row) => doc(String(r.doctorId)),
    },
    {key:"patient",label:"患者",render:(r:Row)=>data.cases.find(c=>c.id===r.caseId)?.patientName || "未记录"},
    {
      key: "service",
      label: "设计阶段",
      render: (r: Row) => (
        <OrderIcons
          stages={
            (r.plannedStages as string[]) ||
            (r.stages as Order["stages"]).map((s) => s.name)
          }
        />
      ),
    },
    {
      key: "status",
      label: "订单状态",
      render: (r: Row) => <Status value={String(r.status)} />,
    },
    {
      key: "updated",
      label: "最近更新时间",
      render: (r: Row) => formatDateTime(String(r.updated)),
    },
    {
      key: "created",
      label: "创建时间",
      render: (r: Row) => formatDateTime(String(r.created)),
    },
    {
      key: "due",
      label: "预计交付时间",
      render: (r: Row) => confirmedDelivery(r) ? formatDate(confirmedDelivery(r)) : "待排期",
    },
    {
      key: "actions",
      label: "操作",
      render: (r: Row) => <div className="sales-order-row-actions"><Button variant="text" theme="primary" className="sales-order-link" onClick={() => go("order/" + r.id)}>查看详情</Button>{r.status === "草稿" && ((r.createdBy || r.ownerSalesId || account.id) === account.id || account.permissions.includes("order.draft.delete")) && <Button variant="text" theme="danger" className="sales-order-link" onClick={()=>setDeleteOrderId(String(r.id))}>删除</Button>}</div>,
    },
  ];
  const doctorPhone = (phone: string, _owner: unknown) =>
    phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "未提供";
  const doctorFields = [
    { key: "name", label: "医生" },
    {
      key: "hospitalId",
      label: "所属医院",
      render: (r: Row) => h(String(r.hospitalId)),
    },
    { key: "department", label: "科室" },
    { key: "title", label: "职称" },
    {
      key: "recent",
      label: "最近更新时间",
      render: (r: Row) => {
        const at = r.updatedAt || data.events.find((e) => e.target === r.id)?.at;
        return at ? formatDynamicTime(String(at)) : "暂无记录";
      },
    },
    {
      key: "phone",
      label: "联系电话",
      render: (r: Row) => doctorPhone(String(r.phone || ""), r.owner),
    },
    {
      key: "status",
      label: "资质审核状态",
      render: (r: Row) => <Status value={String(r.status)} />,
    },
    {
      key: "owner",
      label: "负责销售",
      render: (r: Row) =>
        r.status === "审核通过" && r.owner === account.id
          ? "已关联 · " + account.name
          : r.status === "审核通过" && r.owner
            ? "已有其他销售"
            : "待关联",
    },
    {
      key: "actions",
      label: "操作",
      render: (r: Row) => (
        <div className="sales-order-row-actions"><Button
          className="sales-order-link"
          theme="primary"
          variant="text"
          onClick={() => go("doctor/" + r.id)}
        >
          查看详情
        </Button>{r.status==="草稿"&&(r.createdBy===account.id||account.permissions.includes("doctor.draft.delete"))&&<Button variant="text" theme="danger" className="sales-order-link" onClick={()=>setDeleteDoctorId(String(r.id))}>删除</Button>}</div>
      ),
    },
  ].sort(
    (a, b) =>
      [
        "name",
        "phone",
        "hospitalId",
        "department",
        "title",
        "status",
        "owner",
        "recent",
        "actions",
      ].indexOf(a.key) -
      [
        "name",
        "phone",
        "hospitalId",
        "department",
        "title",
        "status",
        "owner",
        "recent",
        "actions",
      ].indexOf(b.key),
  );
  const matching = orders.filter(
    (o) =>
      (!keyword || [o.id, o.name, o.caseId].some((x) => x.includes(keyword))) &&
      (!filter || o.status === filter) &&
      (!hospitalFilter || o.hospitalId === hospitalFilter) &&
      (!deptFilter || o.department === deptFilter) &&
      (!serviceFilter ||
        (o.plannedStages || o.stages.map((s) => s.name)).includes(
          serviceFilter,
        )) &&
      (!from || formatDate(o.created) >= from) &&
      (!to || formatDate(o.created) <= to),
  );
  const orderEnd = localDate();
  const policyStart = new Date();
  policyStart.setMonth(policyStart.getMonth() - data.policy.months);
  const orderStart = localDate(policyStart);
  const dashboardBuckets=dashboardOrderBuckets(orders,new Date(),data.events);
  const business=salesBusiness(data,orders);
  const filteredOrders=dashboardBuckets[detail] ? matching.filter(o=>dashboardBuckets[detail].some(x=>x.id===o.id)) : detail==="active" ? matching.filter(x=>m.active.some(o=>o.id===x.id)) : detail==="todos" ? matching.filter(x=>m.todos.some(o=>o.id===x.id)) : matching;
  const todos=business.items.filter(i=>i.category!=="业务动态");
  const todoFields=[
    {key:"type",label:"事项类型"},
    {key:"name",label:"事项名称"},
    {key:"object",label:"关联对象"},
    {key:"status",label:"状态",render:(r:Row)=><Tag variant="light">{String(r.status)}</Tag>},
    {key:"at",label:"发生时间",render:(r:Row)=>r.at?formatDynamicTime(String(r.at)):"暂无记录"},
    {key:"actions",label:"操作",render:(r:Row)=><Button className="sales-order-link" theme="primary" variant="text" onClick={()=>go(String(r.route))}>{r.category==="需要处理"?"去处理":r.category==="待继续完成"?"继续编辑":"查看详情"}</Button>},
  ];
  const resetOrders = () => {
    filterCache.current["orders"]={search:"",filter:"",hospitalFilter:"",deptFilter:"",serviceFilter:"",from:"",to:""};
    setSearch("");
    setFilter("");
    setHospitalFilter("");
    setDeptFilter("");
    setServiceFilter("");
    setFrom("");
    setTo("");
    rememberPage("orders", 1);
    if (route.startsWith("orders/")) go("orders");
  };
  const tools = (
    <div className="project-filters sales-order-filters">
      <label>
        <span>订单编号 / 名称</span>
        <Input
          clearable
          value={search}
          onChange={setSearch}
          placeholder="搜索编号、名称或病例"
        />
      </label>
      <div className="project-filter-date">
        <span>创建时间范围</span>
        <RangeControl
          period="custom"
          range={[from, to]}
          minDate={orderStart}
          maxDate={orderEnd}
          allowedMonths={data.policy.months}
          onChange={(_, r) => {
            setFrom(r[0]);
            setTo(r[1]);
          }}
        />
      </div>
      <label>
        <span>医院</span>
        <Select
          clearable
          value={hospitalFilter || "__all__"}
          onChange={(v) => {
            setHospitalFilter(allFilterValue(v));
            if (!data.hospitals.some(h=>(!allFilterValue(v) || h.id===allFilterValue(v)) && h.departments.includes(deptFilter))) setDeptFilter("");
          }}
          placeholder="全部"
          options={[{value:"__all__", label:"全部"}, ...data.hospitals.map((h) => ({ value: h.id, label: h.name }))]}
        />
      </label>
      <label>
        <span>科室</span>
        <Select
          clearable
          value={deptFilter || "__all__"}
          onChange={(v) => setDeptFilter(allFilterValue(v))}
          placeholder="全部"
          options={[{value:"__all__",label:"全部"}, ...[
            ...new Set(
              data.hospitals
                .filter((h) => !hospitalFilter || h.id === hospitalFilter)
                .flatMap((h) => h.departments),
            ),
          ].map((value) => ({ value, label: value }))]}
        />
      </label>
      <label>
        <span>设计阶段</span>
        <Select
          clearable
          value={serviceFilter || "__all__"}
          onChange={(v) => setServiceFilter(allFilterValue(v))}
          placeholder="全部"
          options={[{value:"__all__",label:"全部"}, ...["三维重建", "CAD设计", "有限元分析", "3D打印"].map(
            (value) => ({ value, label: value }),
          )]}
        />
      </label>
      <label>
        <span>订单状态</span>
        <Select
          clearable
          value={filter || "__all__"}
          onChange={(v) => setFilter(allFilterValue(v))}
          placeholder="全部"
          options={[{value:"__all__",label:"全部"}, ...orderStatuses.map((value) => ({ value, label: value }))]}
        />
      </label>
      <Button variant="outline" onClick={resetOrders}>
        重置筛选
      </Button>
    </div>
  );
  const logs = (tid?: string, kind?: "follow" | "review") =>
    data.events
      .filter(
        (e) =>
          (!tid || e.target === tid) &&
          (!kind ||
            (kind === "follow"
              ? e.title === "业务跟进"
              : e.title.includes("审核"))),
      )
      .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))
      .map((e) => (
        <li className="timeline-item" key={e.id}>
          <i />
          <div>
            <strong>{e.title}</strong>
            <p>
              {formatAuditTime(e.at)} ·{" "}
              {e.actor === "管理员（隔离测试）" ? "管理员" : e.actor} {e.detail}
            </p>
          </div>
        </li>
      ));
  const header = (title: React.ReactNode, actions?: React.ReactNode, className="list-page-heading") => (
    <div className={className}>
      <h1>{title}</h1>
      <div>{actions}</div>
    </div>
  );
  let content: React.ReactNode;
  if (settings.includes(section as (typeof settings)[number]))
    content = (
      <SettingsPage
        section={section as (typeof settings)[number]}
        onSectionChange={go}
        onBack={() => go("home")}
        returnLabel="返回销售工作台"
        user={user}
        onUserChange={(v) =>
          auth.updateProfile({ name: v.name, email: v.email, avatar: v.avatar })
        }
        themePreference={dark ? "dark" : "light"}
        onThemePreferenceChange={theme}
        notificationPreferences={noticePreferences}
        onNotificationPreferencesChange={setNoticePreferences}
        onLogout={() =>
          window.dispatchEvent(new Event("clinivol-request-logout"))
        }
      />
    );
  else if (section === "home") {
    const hour = new Date().getHours(),
      greeting =
        hour >= 5 && hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";
    const stats = [
      {
        label: "待处理订单",
        rows: dashboardBuckets.pending,
        route: "pending",
        note: "草稿、待审核与审核退回",
        Icon: TaskFilledIcon,
        tone: "pending",
      },
      {
        label: "进行中订单",
        rows: dashboardBuckets.processing,
        route: "processing",
        note: "专业设计处理中",
        Icon: WorkFilledIcon,
        tone: "progress",
      },
      {
        label: "本月新增订单",
        rows: dashboardBuckets.new,
        route: "new",
        note: "本月创建",
        Icon: FileAddFilledIcon,
        tone: "progress",
      },
      {
        label: "本月已完成订单",
        rows: dashboardBuckets.completed,
        route: "completed",
        note: "本月完成",
        Icon: TaskCheckedFilledIcon,
        tone: "complete",
      },
    ];
    content = (
      <div className="sales-dashboard project-dashboard">
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-copy">
            <h1>
              {greeting}，{account.name}
            </h1>
            <p>
              {business.requiredCount ? `当前有 ${business.requiredCount} 项业务需要处理。` : "当前没有需要处理的业务事项。"}
            </p>
          </div>
          <time className="dashboard-date-text">
            {`${new Date().getFullYear()} 年 ${new Date().getMonth() + 1} 月 ${new Date().getDate()} 日 · ${new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(new Date())}`}
          </time>
        </section>
        <section className="stat-grid" aria-label="销售订单统计">
          {stats.map(({ label, rows, route, note, Icon, tone }) => (
            <Card
              key={route}
              bordered={false}
              className={"stat-card stat-" + tone}
            >
              <Tooltip content={label + "：" + note}>
                <button
                  className="project-stat-action sales-stat-activator"
                  aria-label={label + " " + rows.length}
                  onClick={() => openStat(route)}
                >
                  <div className="stat-card-head">
                    <span className="sales-stat-label">{label}</span>
                    <i>
                      <Icon size={20} />
                    </i>
                  </div>
                  <strong>{rows.length}</strong>
                  <small>{note}</small>
                </button>
              </Tooltip>
            </Card>
          ))}
        </section>
        <section className="dashboard-grid">
          <Card
            bordered={false}
            className="dashboard-card task-card table-card project-home-card"
          >
            <div className="section-heading">
              <h2>近期订单</h2>
              <div className="project-home-controls">
                <RangeControl
                  period="custom"
                  range={homeRange}
                  minDate={orderStart}
                  maxDate={orderEnd}
                  allowedMonths={data.policy.months}
                  onChange={(_period, range) => setHomeRange(range)}
                />
                <Button
                  theme="primary"
                  variant="text"
                  onClick={() => {
                    resetOrders();
                    filterCache.current["orders"]={search:"",filter:"",hospitalFilter:"",deptFilter:"",serviceFilter:"",from:homeRange[0],to:homeRange[1]};
                    setFrom(homeRange[0]);
                    setTo(homeRange[1]);
                    go("orders");
                  }}
                >
                  查看全部
                  <ChevronRightIcon size={15} />
                </Button>
              </div>
            </div>
            <Grid
              paginate={false}
              orderMode
              rows={[...orders]
                .filter(
                  (o) =>
                    formatDate(o.created) >= homeRange[0] &&
                    formatDate(o.created) <= homeRange[1],
                )
                .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated))
                .slice(0, 6)}
              fields={[
                "id",
                "hospitalId",
                "name",
                "doctorId",
                "patient",
                "service",
                "status",
                "created",
                "due",
                "actions",
              ].map((key) => {
                const field = orderFields.find((f) => f.key === key)!;
                return {
                  ...field,
                  label:
                    key === "status"
                      ? "当前进展"
                      : key === "created"
                        ? "创建时间"
                        : key === "due"
                          ? "预计交付时间"
                          : field.label,
                };
              })}
            />
          </Card>
          <Card bordered={false} className="dashboard-card recent-card">
            <div className="section-heading">
              <h2>我的待办</h2><Button variant="text" theme="primary" onClick={()=>{setItemCategory("需要处理");go("todos");}}>查看全部<ChevronRightIcon size={15}/></Button>
            </div>
            <Grid
              paginate={false}
              rows={todos.slice(0, 3)}
              fields={todoFields.filter((f) =>
                ["name", "type", "at", "actions"].includes(f.key),
              )}
            />
          </Card>
          <Card bordered={false} className="dashboard-card attention-card">
            <div className="section-heading">
              <h2>我的业务范围</h2>
              <Button variant="text" theme="primary" onClick={()=>go("customers/doctors")}>查看全部<ChevronRightIcon size={15}/></Button>
            </div>
            <Grid paginate={false} rows={business.hospitals.slice(0,3)} fields={[
              {key:"name",label:"医院"},{key:"departmentCount",label:"授权科室"},{key:"doctorCount",label:"关联医生"},{key:"processingCount",label:"进行中订单"},
            ]}/>
          </Card>
        </section>
      </div>
    );
  } else if (section === "todos") {
    const resetItems=()=>{setItemSearch("");setItemKeyword("");setItemType("");setItemStatus("");setItemDept("");setItemStage("");setItemDoctorStatus("");setItemFrom("");setItemTo("");};
    const fullItems=business.items.filter(i=>i.category===itemCategory).map(i=>{
      const order=i.kind==="order"?orders.find(o=>o.id===i.target):undefined;
      const doctor=data.doctors.find(d=>d.id===(order?.doctorId||i.target));
      return {...order,id:i.id,orderId:order?.id||"",name:order?.name||"不适用",caseId:order?.caseId||"不适用",hospitalId:order?.hospitalId||doctor?.hospitalId||"",department:order?.department||doctor?.department||"",doctorId:doctor?.id||"",doctorName:doctor?.name||"",status:order?.status||"",doctorStatus:i.kind==="doctor"?doctor?.status||"":"",plannedStages:order?.plannedStages||order?.stages.map(s=>s.name)||[],stages:order?.stages||[],updated:order?.updated||doctor?.updatedAt||i.at,created:order?.created||"",route:i.route,category:i.category,operation:i.name,kind:i.kind};
    });
    const itemRows=fullItems.filter(i=>(!itemKeyword||[i.orderId,i.name,i.caseId,i.doctorName].some(v=>v.includes(itemKeyword)))&&(!itemType||i.hospitalId===itemType)&&(!itemDept||i.department===itemDept)&&(!itemStatus||i.status===itemStatus)&&(!itemDoctorStatus||i.doctorStatus===itemDoctorStatus)&&(!itemStage||i.plannedStages.includes(itemStage))&&(!itemFrom||formatDate(i.updated)>=itemFrom)&&(!itemTo||formatDate(i.updated)<=itemTo));
    const itemFields=orderFields.map(field=>({ ...field,render:(row:Row)=>{
      if(field.key==="actions")return <Button className="sales-order-link" theme="primary" variant="text" onClick={()=>go(String(row.route))}>{row.category==="需要处理"?"去处理":row.category==="待继续完成"?"继续编辑":"查看详情"}</Button>;
      if(field.key==="id")return String(row.orderId||"不适用");
      if(row.kind==="doctor"&&["patient","service","status","created","due"].includes(field.key))return "不适用";
      return field.render?field.render(row):String(row[field.key]||"不适用");
    }}));
    itemFields.splice(itemFields.length-1,0,{key:"doctorStatus",label:"资质审核状态",render:(row:Row)=>row.doctorStatus?<Status value={String(row.doctorStatus)}/>:"不适用"},{key:"operation",label:"操作记录",render:(row:Row)=>String(row.operation)});
    content=<><Back onClick={()=>go("home")}>返回工作台</Back><div className="project-page sales-business-page"><Card bordered={false} className="project-list-card sales-order-list-card">
      <div className="project-page-heading"><h1>我的待办</h1></div>
      <Tabs value={itemCategory} onChange={v=>{setItemCategory(String(v));resetItems();}}>{["需要处理","待继续完成","业务动态"].map(category=><Tabs.TabPanel key={category} value={category} label={category}/>)}</Tabs>
      <div className="project-filters">
        <label><span>订单编号 / 名称</span><Input clearable value={itemSearch} onChange={setItemSearch} placeholder="搜索编号、名称、病例或医生"/></label>
        <label><span>医院</span><Select value={itemType||"__all__"} onChange={v=>{setItemType(allFilterValue(v));setItemDept("");}} options={[{value:"__all__",label:"全部"},...data.hospitals.map(h=>({value:h.id,label:h.name}))]}/></label>
        <label><span>科室</span><Select value={itemDept||"__all__"} onChange={v=>setItemDept(allFilterValue(v))} options={[{value:"__all__",label:"全部"},...[...new Set(data.hospitals.filter(h=>!itemType||h.id===itemType).flatMap(h=>h.departments))].map(value=>({value,label:value}))]}/></label>
        <label><span>设计阶段</span><Select value={itemStage||"__all__"} onChange={v=>setItemStage(allFilterValue(v))} options={[{value:"__all__",label:"全部"},...["三维重建","CAD设计","有限元分析","3D打印"].map(value=>({value,label:value}))]}/></label>
        <label><span>订单状态</span><Select value={itemStatus||"__all__"} onChange={v=>setItemStatus(allFilterValue(v))} options={[{value:"__all__",label:"全部"},...orderStatuses.map(value=>({value,label:value}))]}/></label>
        <label><span>资质审核状态</span><Select value={itemDoctorStatus||"__all__"} onChange={v=>setItemDoctorStatus(allFilterValue(v))} options={[{value:"__all__",label:"全部"},...["草稿","待审核","审核退回","审核通过"].map(value=>({value,label:value}))]}/></label>
        <label><span>最近更新时间范围</span><DateRangePicker value={[itemFrom,itemTo]} onChange={v=>{setItemFrom(String(v[0]||""));setItemTo(String(v[1]||""));}} clearable/></label>
        <Button variant="outline" onClick={resetItems}>重置筛选</Button>
      </div>
      <Grid key={itemCategory} pageSize={12} orderMode rows={itemRows} fields={itemFields}/>
    </Card></div></>;
  }
  else if (section === "customers")
    content = (
      <Card bordered={false} className="project-list-card sales-order-list-card sales-customer-list-card">
        {header(
          "客户管理",
          <>
            <Button
              variant="outline"
              theme="default"
              onClick={() => setModal("专属码")}
            >
              我的专属码
            </Button>
            <Button theme="primary" onClick={() => go("doctor-new")}>
              新建医生档案
            </Button>
          </>,
          "project-page-heading",
        )}
        {canReview && (
          <Tabs
            value={detail === "approvals" ? "approvals" : "doctors"}
            onChange={(v) => go("customers/" + v)}
          >
            <Tabs.TabPanel value="doctors" label="医生档案" />
            <Tabs.TabPanel value="approvals" label="业务审批" />
          </Tabs>
        )}
        {detail === "approvals" ? (
          canReview ? (
            <BusinessApprovals
              data={data}
              permissions={account.permissions}
              commit={(c) => commit(c)}
            />
          ) : (
            <Empty description="无业务审批权限" />
          )
        ) : (
          <>
            <div className="project-filters sales-customer-filters">
              <label><span>医生姓名 / 手机号</span><Input clearable value={search} onChange={setSearch} placeholder="搜索医生姓名或手机号" /></label>
              <label><span>医院</span><Select value={hospitalFilter || "__all__"} options={[{value:"__all__",label:"全部"},...data.hospitals.map(h=>({value:h.id,label:h.name}))]} onChange={v=>{setHospitalFilter(allFilterValue(v));if(!data.hospitals.some(h=>(!allFilterValue(v)||h.id===allFilterValue(v))&&h.departments.includes(deptFilter)))setDeptFilter("");}} /></label>
              <label><span>科室</span><Select value={deptFilter || "__all__"} options={[{value:"__all__",label:"全部"},...[...new Set(data.hospitals.filter(h=>!hospitalFilter||h.id===hospitalFilter).flatMap(h=>h.departments))].map(value=>({value,label:value}))]} onChange={v=>setDeptFilter(allFilterValue(v))} /></label>
              <label><span>资质审核状态</span><Select value={filter || "__all__"} options={[{value:"__all__",label:"全部"},...["草稿","待审核","审核通过","审核退回"].map(value=>({value,label:value}))]} onChange={v=>setFilter(allFilterValue(v))} /></label>
              <Button theme="default" variant="outline" onClick={()=>{setSearch("");setHospitalFilter("");setDeptFilter("");setFilter("");rememberPage("doctors",1);}}>重置筛选</Button>
            </div>
            <Grid
              key="doctor-list"
              orderMode
              pageSize={12}
              savedPage={listPages.doctors || 1}
              onPage={(p) => rememberPage("doctors", p)}
              rows={data.doctors.filter(
                (d) =>
                  (!d.owner || d.owner === account.id) &&
                  (!d.createdBy || d.createdBy === account.id) &&
                  (data.hospitals.some(
                    (h) =>
                      h.id === d.hospitalId &&
                      h.departments.includes(d.department),
                  ) ||
                    (!d.hospitalId && d.createdBy === account.id)) &&
                  (d.name.includes(keyword) || d.phone.includes(keyword)) &&
                  (!hospitalFilter || d.hospitalId === hospitalFilter) &&
                  (!deptFilter || d.department === deptFilter) &&
                  (!filter || d.status === filter),
              )}
              fields={doctorFields}
            />
          </>
        )}
      </Card>
    );
  else if (section === "hospital") {
    const hospital = account.permissions.includes("hospital.directory.read")
      ? data.hospitals.find((h) => h.id === detail)
      : undefined;
    content = hospital ? (
      <>
        <Back onClick={() => go("customers")}>返回客户管理</Back>
        <Card bordered={false} className="project-info-card">
          {header(hospital.name, undefined)}

          <dl className="project-info-grid">
            {[
              ["医院编号", hospital.id],
              ["区域", hospital.region],
              ["负责销售", account.name],
              ["授权科室", hospital.departments.join("、")],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Tabs defaultValue="doctors">
            <Tabs.TabPanel value="doctors" label="科室与医生">
              <Grid
                rows={data.doctors.filter((d) => d.hospitalId === detail)}
                fields={doctorFields}
              />
            </Tabs.TabPanel>
            <Tabs.TabPanel value="orders" label="关联订单">
              <Grid
                rows={orders.filter((o) => o.hospitalId === detail)}
                fields={orderFields}
              />
            </Tabs.TabPanel>
          </Tabs>
        </Card>
      </>
    ) : (
      <Empty description="医院不在授权范围" />
    );
  } else if (section === "doctor-new")
    content = (
      <DoctorEditor
        key={detail || "new"}
        data={data}
        initial={data.doctors.find(
          (d) => d.id === detail && (!d.owner || d.owner === account.id),
        )}
        save={(d, submit) => {
          if (
            commit({
              type: submit ? "doctor-save-submit" : "doctor-save",
              value: d,
            })
          )
            go("doctor/" + d.id);
        }}
        cancel={() => go("customers/doctors")}
      />
    );
  else if (section === "doctor") {
    const d = data.doctors.find(
      (d) => d.id === detail && (!d.owner || d.owner === account.id),
    );
    const doctorHeader = (title:React.ReactNode, actions:React.ReactNode) => <div className="section-heading"><h2>{title}</h2><div className="sales-actions-inline">{actions}</div></div>;
    content = d ? (
      <>
        <Back onClick={() => go("customers/doctors")}>返回客户管理</Back>
        <Card bordered={false} className="project-info-card sales-doctor-detail-card">
          {doctorHeader(
            "基本资料",
            <>
              {["草稿", "审核退回"].includes(d.status) &&
              (!d.owner || d.owner === account.id) ? (
                <>
                  <Button
                    theme="default" variant="outline"
                    onClick={() => go("doctor-new/" + d.id)}
                  >
                    {d.status === "审核退回" ? "修改资料" : "编辑资料"}
                  </Button>
                  <Button
                    theme="primary"
                    disabled={
                      !["草稿", "审核退回"].includes(d.status) ||
                      !d.name ||
                      !/^1[3-9]\d{9}$/.test(d.phone) ||
                      !d.title ||
                      !d.certificate ||
                      !d.hospitalId ||
                      !d.department ||
                      !d.materials.some((f) => f.category === "identity") ||
                      !d.materials.some(
                        (f) => f.category === "practice" || !f.category,
                      )
                    }
                    onClick={() =>
                      commit({ type: "doctor-submit", target: d.id })
                    }
                  >
                    {d.status === "审核退回" ? "重新提交审核" : "提交审核"}
                  </Button>
                </>
              ) : (
                null
              )}
            </>,
          )}

              <dl className="project-info-grid">
                {[
                  ["医生", d.name],
                  ["资质审核状态", <Status value={d.status}/>],
                  ["所属医院", h(d.hospitalId)],
                  ["所属科室", d.department],
                  ["职称", d.title],
                  ["联系电话", doctorPhone(d.phone || "", d.owner)],
                  ["执业证书编号", d.certificate || "未提供"],
                  [
                    "负责销售",
                    d.owner === account.id
                      ? account.name
                      : d.owner
                        ? "其他销售"
                        : "待关联",
                  ],
                  ["建档来源", d.source],
                  [
                    "最近更新时间",
                    data.events.find((e) => e.target === d.id)?.at
                      ? formatAuditTime(
                          data.events.find((e) => e.target === d.id)!.at,
                        )
                      : "暂无记录",
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
        </Card>
        <Card bordered={false} className="project-info-card sales-doctor-detail-card sales-doctor-materials">
          <div className="section-heading"><h2>资质材料</h2></div>
          {d.owner && d.owner!==account.id ? <Empty description="无资质附件访问权限"/> : ([['identity','身份证明'],['practice','执业证明材料'],['other','其他附件']] as const).map(([category,label])=><section className="sales-proof-group" key={category}><h3>{label}</h3><SalesAttachments owner={account.id} ownerName={account.name} value={d.materials} category={category} emptyText="暂无附件" readonly /></section>)}
        </Card>
        <Card bordered={false} className="project-info-card sales-doctor-detail-card">
          <div className="section-heading"><h2>关联订单</h2></div>
          <Grid orderMode rows={orders.filter(o=>o.doctorId===d.id)} fields={orderFields.map(field=>field.key==="actions" ? {...field,render:(row:Row)=><Button className="sales-order-link" theme="primary" variant="text" onClick={()=>go("order/"+row.id)}>查看详情</Button>} : field)}/>
        </Card>
        <Card bordered={false} className="project-info-card sales-doctor-detail-card">
          <div className="section-heading"><h2>操作记录</h2></div>
          {data.events.some(e=>e.target===d.id) ? <ul className="timeline sales-log">{logs(d.id)}</ul> : <Empty/>}
        </Card>
      </>
    ) : (
      <Empty description="档案不存在" />
    );
  } else if (section === "orders")
    content = (
      <div className="project-page sales-order-page">
        <Card
          bordered={false}
          className="project-list-card sales-order-list-card"
        >
          <div className="project-page-heading">
            <h1>订单管理</h1>
            <Button theme="primary" onClick={() => go("order-new")}>
              新建订单
            </Button>
          </div>
          {tools}
          <Grid
            key={"order-list:" + detail}
            orderMode
            pageSize={12}
            highlight={highlightOrder}
            savedPage={listPages.orders || 1}
            onPage={(p) => rememberPage("orders", p)}
            rows={filteredOrders}
            fields={orderFields}
          />
        </Card>
      </div>
    );
  else if (section === "order-new")
    content = (
      <OrderEditor
        key={detail || "new"}
        data={data}
        initial={data.orders.find(
          (o) =>
            o.id === detail &&
            canReadOrder(data, o) &&
            ["草稿", "审核退回"].includes(o.status),
        )}
        doctorId={
          data.doctors.some((d) => d.id === detail) ? detail : undefined
        }
        caseId={caseRoute}
        createCase={(value) => commit({ type: "case-create", value })}
        save={async (o, submit, patientName) => {
          try {
            if (submit) {
              const response = await fetch("/api/sales-demo/order-validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ownerId: account.id,
                  order: o,
                  patientName,
                }),
              });
              const result = await response.json();
              if (!response.ok)
                throw Error(
                  Object.values(result.errors || {}).join(" ") ||
                    result.error ||
                    "无法核验订单，请稍后重试。",
                );
            }
            const authority = {
              id: account.id,
              name: account.name,
              permissions: account.permissions,
            };
            let next = data;
            const clinicalCase = data.cases.find((c) => c.id === o.caseId);
            if (clinicalCase && !clinicalCase.patientName && patientName)
              next = transition(
                next,
                {
                  type: "case-fill",
                  value: { ...clinicalCase, patientName },
                },
                authority,
              );
            next = transition(
              next,
              { type: "order-save", value: o },
              authority,
            );
            if (submit)
              next = transition(
                next,
                { type: "order-submit", target: o.id },
                authority,
              );
            storage.setItem("sales-v1", JSON.stringify(next));
            setData(next);
            void MessagePlugin.success(
              submit ? "订单已提交，等待审核" : "草稿已保存",
            );
            if (submit) {
              resetOrders();
              setHighlightOrder(o.id);
              go("orders");
              document.querySelector(".main-content")?.scrollTo({ top: 0 });
            } else go("order/" + o.id);
            return true;
          } catch (e) {
            void MessagePlugin.error((e as Error).message);
            return false;
          }
        }}
        cancel={() => go("orders")}
      />
    );
  else if (section === "order") {
    const o = data.orders.find((o) => o.id === detail);
    content = !o ? (
      <Empty description="订单不存在" />
    ) : !canReadOrder(data, o) ? (
      <Card title="历史订单访问受限">
        <p>
          该订单不在当前授权时间窗口内。
          {o.status !== "已完成" ? "订单尚未完结，需申请临时访问或移交。" : ""}
        </p>
        {account.permissions.includes("order.history.request") && (
          <Button onClick={() => applyRequest("历史访问", o.id)}>
            申请临时访问
          </Button>
        )}
      </Card>
    ) : (
      <OrderDetail
        order={o}
        data={data}
        ownerName={account.name}
        onBack={() => go("orders")}
        onEdit={() => go("order-new/" + o.id)}
        status={<Status value={o.status} />}
      />
    );
  } else if (section === "case") {
    const c = data.cases.find(
      (c) =>
        c.id === detail &&
        data.doctors.some((d) => d.id === c.doctorId && d.owner === account.id),
    );
    content = c ? (
      <>
        <Back onClick={() => go("doctor/" + c.doctorId)}>返回医生档案</Back>
        <Card bordered={false} className="project-info-card">
          {header(
            c.id,
            <Button
              theme="primary"
              onClick={() => go("order-new/" + c.doctorId + "/" + c.id)}
            >
              为本病例新建订单
            </Button>,
          )}
          <dl className="project-info-grid">
            <div>
              <dt>病例摘要</dt>
              <dd>{c.summary}</dd>
            </div>
            <div>
              <dt>关联医生</dt>
              <dd>{doc(c.doctorId)}</dd>
            </div>
          </dl>
          <Grid
            rows={orders.filter((o) => o.caseId === c.id)}
            fields={orderFields}
          />
        </Card>
      </>
    ) : (
      <Empty description="病例不在授权范围" />
    );
  } else if (section === "history")
    content = !account.permissions.includes("order.history.request") ? (
      <Empty description="无历史访问申请权限" />
    ) : (
      <>
        <Back onClick={() => go("orders")}>返回订单管理</Back>
        <Card bordered={false} className="project-info-card">
          {header("历史订单访问申请")}
          <p>
            当前可查看最近{data.policy.months}
            个月的授权订单；超期订单可申请临时访问。
          </p>
          <Grid
            rows={data.orders
              .filter((o) => !canReadOrder(data, o))
              .map((o) => ({ id: o.id, status: o.status }))}
            fields={[
              { key: "id", label: "受限订单编号" },
              {
                key: "status",
                label: "处理状态",
                render: (r) => <Status value={String(r.status)} />,
              },
              {
                key: "actions",
                label: "操作",
                render: (r) => (
                  <Button
                    onClick={() => applyRequest("历史访问", String(r.id))}
                  >
                    申请访问
                  </Button>
                ),
              },
            ]}
          />
          <RequestList data={data} />
        </Card>
      </>
    );
  else if (section === "performance") {
    const items = orders.filter(
      (o) =>
        localMonth(o.created) === month &&
        (!hospitalFilter || o.hospitalId === hospitalFilter) &&
        (!deptFilter || o.department === deptFilter) &&
        (!serviceFilter || o.service === serviceFilter),
    );
    content = (
      <Card bordered={false} className="unified-list-card">
        {header("业绩统计")}
        <div className="sales-filters">
          <DatePicker
            mode="month"
            format="YYYY-MM"
            value={month}
            onChange={(v) => setMonth(String(v))}
          />
          <Button onClick={() => setMonth(localMonth(new Date()))}>本月</Button>
          <Button
            onClick={() => {
              const d = new Date();
              d.setMonth(d.getMonth() - 1);
              setMonth(localMonth(d));
            }}
          >
            上月
          </Button>
        </div>
        <div className="sales-filters">
          <Select
            clearable
            placeholder="医院"
            value={hospitalFilter || undefined}
            options={data.hospitals.map((h) => ({
              value: h.id,
              label: h.name,
            }))}
            onChange={(v) => {
              setHospitalFilter(String(v || ""));
              setDeptFilter("");
            }}
          />
          <Select
            clearable
            placeholder="科室"
            value={deptFilter || undefined}
            options={[
              ...new Set(
                data.hospitals
                  .filter((h) => !hospitalFilter || h.id === hospitalFilter)
                  .flatMap((h) => h.departments),
              ),
            ].map((value) => ({ value, label: value }))}
            onChange={(v) => setDeptFilter(String(v || ""))}
          />
          <Select
            clearable
            placeholder="服务类型"
            value={serviceFilter || undefined}
            options={services.map((value) => ({ value, label: value }))}
            onChange={(v) => setServiceFilter(String(v || ""))}
          />
        </div>
        <section className="sales-section-body">
          <h3>自然月业务量</h3>
          <p>
            新增订单：{items.length}　当月完成：
            {
              orders.filter(
                (o) =>
                  o.status === "已完成" &&
                  localMonth(o.updated) === month &&
                  (!hospitalFilter || o.hospitalId === hospitalFilter) &&
                  (!deptFilter || o.department === deptFilter) &&
                  (!serviceFilter || o.service === serviceFilter),
              ).length
            }
          </p>
          <p className="sales-muted">
            金额及收入未接入可靠财务数据，不计算销售提成。
          </p>
          <Grid
            rows={data.hospitals.map((h) => ({
              id: h.id,
              name: h.name,
              count: items.filter((o) => o.hospitalId === h.id).length,
            }))}
            fields={[
              { key: "name", label: "医院" },
              { key: "count", label: "本月新增订单" },
            ]}
          />
          <h3>按服务类型</h3>
          {services.map((s) => (
            <p key={s}>
              {s}：{items.filter((o) => o.service === s).length}
            </p>
          ))}
        </section>
      </Card>
    );
  } else if (section === "notifications")
    content = (
      <>
        <Back onClick={() => go("home")}>返回工作台</Back>
        <Card bordered={false} className="project-info-card">
          {header("消息通知")}
          {data.events.filter((e) => !e.read).length} 条未读
          <Grid
            rows={data.events}
            fields={[
              { key: "title", label: "业务消息" },
              {
                key: "at",
                label: "时间",
                render: (r) => formatDynamicTime(String(r.at)),
              },
              {
                key: "read",
                label: "状态",
                render: (r) => (r.read ? "已读" : "未读"),
              },
              {
                key: "actions",
                label: "操作",
                render: (r) => (
                  <Button
                    onClick={() => {
                      openEvent(r as Row & { target: unknown });
                    }}
                  >
                    查看
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </>
    );
  else
    content = (
      <div>
        <Empty description="页面不存在" />
        <Button onClick={() => go("home")}>返回工作台</Button>
      </div>
    );
  return (
    <div className="app sales-app">
      <GlobalHeader
        showTaskTabs={false}
        screen={{ kind: "home" }}
        openTabs={[]}
        tasks={[]}
        user={user}
        theme={dark ? "dark" : "light"}
        goHome={() => go("home")}
        openWorkspace={() => {}}
        closeTab={() => {}}
        unreadCount={data.events.filter((e) => !e.read).length}
        onThemeToggle={() => theme(dark ? "light" : "dark")}
        onNotifications={() => setNotificationsOpen(true)}
        onLock={() => void auth.lock()}
        onOpenSettings={go}
        onLogout={() =>
          window.dispatchEvent(new Event("clinivol-request-logout"))
        }
      />
      <div
        className={
          collapsed
            ? "platform-shell sales-layout nav-collapsed"
            : "platform-shell sales-layout"
        }
      >
        <aside
          className={collapsed ? "business-nav is-collapsed" : "business-nav"}
        >
          <Menu
            value={active}
            collapsed={collapsed}
            width={[224, 64]}
            onChange={(v) => go(String(v))}
          >
            {[
              ["home", "工作台", HomeIcon],
              ["orders", "订单管理", TaskIcon],
              ["customers", "客户管理", UserBusinessIcon],
            ].map(([value, label, Icon]) => {
              const I = Icon as typeof HomeIcon;
              return (
                <Menu.MenuItem
                  key={String(value)}
                  value={String(value)}
                  onClick={() => go(String(value))}
                  icon={
                    <span className="nav-menu-icon">
                      <I size={18} />
                    </span>
                  }
                >
                  {String(label)}
                </Menu.MenuItem>
              );
            })}
          </Menu>
          <Tooltip
            content={collapsed ? "展开导航" : "收起导航"}
            placement="right"
          >
            <button
              className="nav-collapse"
              aria-label={collapsed ? "展开导航" : "收起导航"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <MenuUnfoldIcon size={18} />
              ) : (
                <MenuFoldIcon size={18} />
              )}
            </button>
          </Tooltip>
        </aside>
        <main className="platform-main">
          {settings.includes(section as (typeof settings)[number]) ? (
            content
          ) : (
            <div
              className={
                section === "home"
                  ? "page dashboard-page"
                  : "page project-page sales-page"
              }
            >
              {content}
            </div>
          )}
        </main>
      </div>
      <Drawer
        visible={notificationsOpen}
        placement="right"
        size="400px"
        header={
          <div className="drawer-title">
            <span>通知中心</span>
            <Tag variant="light" theme="primary">
              {data.events.filter((e) => !e.read).length} 条未读
            </Tag>
          </div>
        }
        footer={false}
        onClose={() => setNotificationsOpen(false)}
      >
        <div className="notice-filters">
          {["全部", "未读", "已读"].map((f) => (
            <Button
              key={f}
              variant="text"
              className={noticeFilter === f ? "notice-filter-active" : ""}
              onClick={() => setNoticeFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="notice-list">
          {!data.events.some(
            (e) =>
              noticeFilter === "全部" ||
              (noticeFilter === "未读" ? !e.read : e.read),
          ) && (
            <Empty
              description={
                noticeFilter === "未读"
                  ? "暂无未读通知"
                  : noticeFilter === "已读"
                    ? "暂无已读通知"
                    : "暂无通知"
              }
            />
          )}
          {data.events
            .filter(
              (e) =>
                noticeFilter === "全部" ||
                (noticeFilter === "未读" ? !e.read : e.read),
            )
            .map((e) => (
              <div
                key={e.id}
                className={"notice-item " + (!e.read ? "notice-unread" : "")}
              >
                <button
                  className="notice-item-main"
                  onClick={() => {
                    setNotificationsOpen(false);
                    openEvent(e);
                  }}
                >
                  <NotificationIcon size={20} />
                  <span>
                    <strong>{e.title}</strong>
                    <small>{eventSummary(e)}</small>
                    <em>{formatDynamicTime(e.at)}</em>
                  </span>
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            ))}
        </div>
        <Button
          variant="outline"
          block
          onClick={() => {
            const next = {
              ...data,
              events: data.events.map((e) => ({ ...e, read: true })),
            };
            storage.setItem("sales-v1", JSON.stringify(next));
            setData(next);
          }}
        >
          全部标记为已读
        </Button>
      </Drawer>
      <Dialog visible={!!deleteDoctorId} header="删除医生档案草稿？" confirmBtn={{content:"删除",theme:"danger"}} cancelBtn={{content:"取消",theme:"default",variant:"outline"}} onClose={()=>setDeleteDoctorId("")} onConfirm={()=>{if(commit({type:"doctor-delete",target:deleteDoctorId}))setDeleteDoctorId("");}}>删除后，该草稿将无法恢复，请确认是否继续。</Dialog>
      <Dialog visible={!!deleteOrderId} header="删除订单草稿？" confirmBtn={{content:"删除",theme:"danger"}} cancelBtn={{content:"取消",theme:"default",variant:"outline"}} onClose={()=>setDeleteOrderId("")} onConfirm={()=>{if(commit({type:"order-delete",target:deleteOrderId})){setDeleteOrderId("");}}}>删除后，该订单草稿将无法恢复，请确认是否继续。</Dialog>
      {import.meta.env.DEV && <Dialog visible={scenarioConfirm} header="载入销售订单演示场景？" onClose={()=>setScenarioConfirm(false)} onConfirm={()=>{try {const next=addOrderScenario(data);storage.setItem("sales-v1",JSON.stringify(next));setData(next);setScenarioConfirm(false);setTestOpen(false);resetOrders();go("home");void MessagePlugin.success("演示场景已载入，原有订单和病例保留");}catch(e){void MessagePlugin.error((e as Error).message);}}}>增加具有完整状态记录的合成订单及病例。保留现有医生、订单、病例、文件及账号数据，不重复覆盖已载入场景。</Dialog>}
      <SalesInviteDialog
        visible={modal === "专属码"}
        onClose={() => setModal("")}
        hospitals={data.hospitals}
        count={m.doctors.length}
        pending={
          data.doctors.filter(
            (d) => d.source.startsWith("CV-SALES-") && !d.owner,
          ).length
        }
      />
      <Dialog
        visible={!!modal && modal !== "专属码"}
        header={modal}
        onClose={() => setModal("")}
        footer={modal === "专属码" ? false : undefined}
        onConfirm={() => {
          let c: Command;
          if (modal === "新建病例")
            c = {
              type: "case-create",
              value: {
                id: "CASE-" + id().slice(0, 8),
                doctorId: target,
                summary: reason,
              },
            };
          else if (modal === "业务跟进")
            c = { type: "followup", target, reason };
          else
            c = {
              type: "request",
              value: {
                id: id(),
                kind: modal,
                target,
                reason,
                newOwner: account.id,
                at: "",
                status: "待审核",
                oldOwner: data.doctors.find((d) => d.id === target)?.owner,
              },
            };
          if (commit(c)) setModal("");
        }}
      >
        <Input
          value={reason}
          onChange={setReason}
          placeholder={
            modal === "新建病例" ? "填写脱敏病例需求摘要" : "填写原因或跟进内容"
          }
        />
      </Dialog>
      {import.meta.env.DEV && (
        <>
          <Button
            className="sales-test-toggle"
            variant="outline"
            onClick={() => setTestOpen(true)}
          >
            销售测试控制台
          </Button>
          <Dialog
            visible={testOpen}
            header="隔离销售业务测试"
            footer={false}
            onClose={() => setTestOpen(false)}
          >
            <p>
              仅修改当前销售的本地合成业务数据，不修改真实账号权限或工程师数据。
            </p>
            <Button variant="outline" onClick={()=>setScenarioConfirm(true)}>载入V2.3销售订单场景</Button>
            <h3>历史可见窗口（演示配置）</h3>
            <Select
              value={data.policy.months}
              options={[
                { label: "最近三个月", value: 3 },
                { label: "最近六个月", value: 6 },
              ]}
              onChange={(v) => {
                const next = {
                  ...data,
                  policy: { ...data.policy, months: Number(v) as 3 | 6 },
                };
                storage.setItem("sales-v1", JSON.stringify(next));
                setData(next);
              }}
            />
            <Select
              value={data.policy.basis}
              options={[
                {
                  label: "演示业务日期（正式口径待确认）",
                  value: "businessDate",
                },
                { label: "创建日期（演示备选口径）", value: "created" },
              ]}
              onChange={(v) => {
                const next = {
                  ...data,
                  policy: {
                    ...data.policy,
                    basis: String(v) as "created" | "businessDate",
                  },
                };
                storage.setItem("sales-v1", JSON.stringify(next));
                setData(next);
              }}
            />
            <Input
              value={reason}
              onChange={setReason}
              placeholder="退回或补件原因"
            />
            <h3>邀请建档验证码</h3>
            <Button
              theme="default"
              variant="outline"
              onClick={() =>
                void fetch("/api/sales-demo/codes")
                  .then(async (r) => {
                    const body = await r.json();
                    if (!r.ok) throw Error(body.error);
                    setInviteCodes(body.codes);
                  })
                  .catch((e) => MessagePlugin.error(e.message))
              }
            >
              刷新邀请验证码
            </Button>
            {inviteCodes.map((c) => (
              <p key={c.phone}>
                {c.phone} · {c.code} · {formatAuditTime(c.expiresAt)} 到期
                <Button
                  variant="text"
                  onClick={() => void navigator.clipboard.writeText(c.code)}
                >
                  复制
                </Button>
              </p>
            ))}
            <h3>待审核医生</h3>
            {data.doctors
              .filter((d) => d.status === "待审核")
              .map((d) => (
                <p key={d.id}>
                  {d.name}{" "}
                  <Button
                    onClick={() =>
                      commit(
                        {
                          type: "doctor-review",
                          target: d.id,
                          value: "审核通过",
                        },
                        true,
                      )
                    }
                  >
                    审核通过
                  </Button>
                  <Button
                    onClick={() =>
                      commit(
                        {
                          type: "doctor-review",
                          target: d.id,
                          value: "审核退回",
                          reason,
                        },
                        true,
                      )
                    }
                  >
                    审核退回
                  </Button>
                </p>
              ))}
            <h3>订单推进</h3>
            {orders
              .filter((o) => ["待审核", "处理中"].includes(o.status))
              .map((o) => (
                <div key={o.id}>
                  <p>
                    {o.id} · {o.status}
                  </p>
                  {(o.status === "待审核"
                    ? ["处理中", "审核退回", "已取消"]
                    : ["已完成", "已取消"]
                  ).map((s) => (
                    <Button
                      key={s}
                      aria-label={o.id + " " + s}
                      onClick={() =>
                        commit(
                          {
                            type: "order-advance",
                            target: o.id,
                            value: s,
                            reason,
                          },
                          true,
                        )
                      }
                    >
                      {s === "已取消" ? "拒绝受理" : s}
                    </Button>
                  ))}
                  {o.status === "处理中" && (
                    <Button
                      aria-label={o.id + " 确认结果"}
                      onClick={() =>
                        commit({ type: "order-confirm", target: o.id }, true)
                      }
                    >
                      确认结果
                    </Button>
                  )}
                  {o.status === "处理中" && (
                    <Button
                      aria-label={o.id + " 完成当前专业阶段"}
                      onClick={() =>
                        commit({ type: "order-stage", target: o.id }, true)
                      }
                    >
                      完成当前专业阶段
                    </Button>
                  )}
                </div>
              ))}
            <h3>关联与访问申请</h3>
            {data.requests
              .filter((r) => r.status === "待审核")
              .map((r) => (
                <p key={r.id}>
                  {r.kind} · {r.target}
                  <Button
                    onClick={() =>
                      commit(
                        { type: "request-review", target: r.id, value: "通过" },
                        true,
                      )
                    }
                  >
                    {r.kind === "历史访问" ? "批准访问24小时" : "批准"}
                  </Button>
                  <Button
                    onClick={() =>
                      commit(
                        {
                          type: "request-review",
                          target: r.id,
                          value: "退回",
                          reason,
                        },
                        true,
                      )
                    }
                  >
                    退回
                  </Button>
                </p>
              ))}
          </Dialog>
        </>
      )}
    </div>
  );
}
function RequestList({ data }: { data: SalesData }) {
  return (
    <Grid
      rows={data.requests}
      fields={[
        { key: "kind", label: "申请类型" },
        { key: "target", label: "关联记录" },
        { key: "reason", label: "原因" },
        {
          key: "status",
          label: "审核状态",
          render: (r) => <Status value={String(r.status)} />,
        },
        {
          key: "oldOwner",
          label: "原销售",
          render: (r) => (r.oldOwner ? "其他销售" : "未关联"),
        },
        {
          key: "newOwner",
          label: "申请销售",
          render: (r) => String(r.newOwner),
        },
        { key: "reviewer", label: "审批人" },
        {
          key: "reviewedAt",
          label: "生效时间",
          render: (r) =>
            r.reviewedAt ? formatAuditTime(String(r.reviewedAt)) : "尚未生效",
        },
        {
          key: "at",
          label: "申请时间",
          render: (r) => formatAuditTime(String(r.at)),
        },
        {
          key: "expires",
          label: "访问有效期",
          render: (r) =>
            r.expires ? formatAuditTime(String(r.expires)) : "尚未批准",
        },
      ]}
    />
  );
}
function DoctorEditor({
  data,
  initial,
  save,
  cancel,
}: {
  data: SalesData;
  initial?: Doctor;
  save: (d: Doctor, submit: boolean) => void;
  cancel: () => void;
}) {
  const [d, set] = useState<Doctor>(
    initial || {
      id: "D-" + id(),
      name: "",
      phone: "",
      hospitalId: "",
      department: "",
      title: "",
      certificate: "",
      status: "草稿",
      owner: null,
      materials: [],
      reason: "",
      source: "销售建档",
      createdBy: data.ownerId,
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [busySlots, setBusySlots] = useState<Record<string, boolean>>({});
  const busy = Object.values(busySlots).some(Boolean);
  const setUploadBusy = (slot: string, value: boolean) =>
    setBusySlots((previous) => ({ ...previous, [slot]: value }));
  const submit = (review: boolean) => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "请填写真实姓名";
    if (d.phone && !/^1[3-9]\d{9}$/.test(d.phone)) e.phone = "请输入有效手机号";
    if (review) {
      if (!d.phone) e.phone = "请填写联系手机号";
      for (const [key, label] of [
        ["hospitalId", "所属医院"],
        ["department", "所属科室"],
        ["title", "职称"],
        ["certificate", "执业证书编号"],
      ])
        if (!String(d[key as keyof Doctor] || "").trim())
          e[key] = "请填写" + label;
      if (!d.materials.some((f) => f.category === "identity"))
        e.identity = "请上传身份证明照片";
      if (!d.materials.some((f) => f.category === "practice" || !f.category))
        e.practice = "请上传执业证明材料";
    }
    setErrors(e);
    if (!Object.keys(e).length) save(d, review);
  };
  const field = (
    key: "name" | "phone" | "title" | "certificate",
    label: string,
  ) => (
    <Field label={label} requiredMark error={errors[key]}>
      <Input value={d[key]} onChange={(v) => set({ ...d, [key]: v })} />
    </Field>
  );
  return (
    <>
      <Back onClick={cancel}>返回客户管理</Back>
      <Card bordered={false} className="project-info-card">
        <h2>{initial ? "编辑" : "新建"}医生档案</h2>
        <Form
          className="sales-doctor-form"
          labelAlign="top"
          onSubmit={() => submit(true)}
        >
          <section className="sales-doctor-section"><h3>基本资料</h3>
          {field("name", "真实姓名")}
          {field("phone", "联系手机号")}
          </section><section className="sales-doctor-section"><h3>执业信息</h3>
          <Field label="所属医院" requiredMark error={errors.hospitalId}>
            <Select
              value={d.hospitalId}
              options={data.hospitals.map((h) => ({
                value: h.id,
                label: h.name,
              }))}
              onChange={(v) =>
                set({ ...d, hospitalId: String(v), department: "" })
              }
            />
          </Field>
          <Field label="所属科室" requiredMark error={errors.department}>
            <Select
              value={d.department}
              options={(
                data.hospitals.find((h) => h.id === d.hospitalId)
                  ?.departments || []
              ).map((value) => ({ value, label: value }))}
              onChange={(v) => set({ ...d, department: String(v) })}
            />
          </Field>
          {field("title", "职称")}
          {field("certificate", "执业证书编号")}
          </section><section className="sales-doctor-section"><h3>证明材料</h3>
          <Field label="身份证明照片" requiredMark error={errors.identity}>
            <SalesAttachments
              owner={data.ownerId}
              value={d.materials}
              category="identity"
              images
              onBusyChange={(value) => setUploadBusy("identity", value)}
              onChange={(materials) => set({ ...d, materials })}
            />
          </Field>
          <Field label="医师执业证明照片" error={errors.practice}>
            <SalesAttachments
              owner={data.ownerId}
              value={d.materials}
              category="practice"
              images
              onBusyChange={(value) => setUploadBusy("practice", value)}
              onChange={(materials) => set({ ...d, materials })}
            />
          </Field>
          <Field label="执业证明PDF">
            <SalesAttachments owner={data.ownerId} value={d.materials} category="practice" images={false} accept="application/pdf" onBusyChange={value=>setUploadBusy("practice-pdf",value)} onChange={materials=>set({...d,materials})}/>
          </Field>
          <Field label="PDF及其他证明文件">
            <SalesAttachments
              owner={data.ownerId}
              value={d.materials}
              category="other"
              onBusyChange={(value) => setUploadBusy("other", value)}
              onChange={(materials) => set({ ...d, materials })}
            />
          </Field>
          </section>
          {d.reason && <p className="sales-error">{d.reason}</p>}
          <div className="sales-actions">
            <Button
              theme="default"
              variant="outline"
              disabled={busy}
              onClick={() => submit(false)}
            >
              保存草稿
            </Button>
            <Button theme="primary" type="submit" disabled={busy}>
              {d.status === "审核退回" ? "重新提交审核" : "提交审核"}
            </Button>
          </div>
        </Form>
      </Card>
    </>
  );
}
function Back({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      className="sales-back"
      variant="text"
      theme="default"
      icon={<ChevronLeftIcon size={16} />}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Field({
  label,
  error,
  requiredMark,
  children,
}: {
  label: React.ReactNode;
  error?: string | false;
  requiredMark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Form.FormItem
      label={label}
      requiredMark={requiredMark}
      status={error ? "error" : undefined}
      tips={error || undefined}
    >
      <>{children}</>
    </Form.FormItem>
  );
}

function BusinessApprovals({
  data,
  permissions,
  commit,
}: {
  data: SalesData;
  permissions: string[];
  commit: (c: Command) => boolean;
}) {
  const [reason, setReason] = useState("");
  const rows = data.requests.filter((r) =>
    permissions.includes(
      r.kind === "历史访问"
        ? "order.history.review"
        : "doctor.assignment.review",
    ),
  );
  return (
    <section className="sales-section-body">
      <h3>业务审批</h3>
      <Input
        value={reason}
        onChange={setReason}
        placeholder="审批说明（退回必填）"
      />
      <Grid
        rows={rows}
        fields={[
          { key: "kind", label: "申请类型" },
          { key: "target", label: "关联记录" },
          { key: "oldOwner", label: "原销售" },
          { key: "newOwner", label: "申请销售" },
          { key: "reason", label: "申请原因" },
          {
            key: "status",
            label: "状态",
            render: (r) => <Status value={String(r.status)} />,
          },
          {
            key: "actions",
            label: "操作",
            render: (r) =>
              r.status === "待审核" ? (
                <>
                  <Button
                    variant="text"
                    onClick={() =>
                      commit({
                        type: "request-review",
                        target: String(r.id),
                        value: "通过",
                        reason,
                      })
                    }
                  >
                    通过
                  </Button>
                  <Button
                    variant="text"
                    onClick={() =>
                      commit({
                        type: "request-review",
                        target: String(r.id),
                        value: "退回",
                        reason,
                      })
                    }
                  >
                    退回
                  </Button>
                </>
              ) : (
                <span>已处理</span>
              ),
          },
        ]}
      />
    </section>
  );
}
