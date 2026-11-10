import { ChevronLeftIcon, ChevronRightIcon } from "../design-system/tdesign";
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
  Steps,
  DatePicker,
  Menu,
  MessagePlugin,
  Tooltip,
  Upload,
} from "tdesign-react";
import {
  HomeIcon,
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
import { formatAuditTime, formatDynamicTime, formatDate } from "../dateTime";
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
  Attachment,
  Command,
  Request as SalesRequest,
} from "./model";
import { saveFile, openFile } from "./files";
import "./sales.css";
import { SalesInviteDialog, readInviteLeads } from "./SalesInvite";
type Row = Record<string, unknown>;
const settings = ["profile", "security", "preferences"] as const;
const statusTheme = (s: string) =>
  s.includes("退回") || s === "待补资料"
    ? "danger"
    : (s.includes("审核") && s !== "审核通过") ||
        ["待受理", "待客户确认"].includes(s)
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
}: {
  rows: Row[];
  paginate?: boolean;
  fields: {
    key: string;
    label: string;
    render?: (row: Row) => React.ReactNode;
  }[];
}) {
  const [page, setPage] = useState(1);
  const rowIdentity = rows.map((r) => String(r.id)).join("|");
  useEffect(() => setPage(1), [rowIdentity]);
  const width = (key: string) =>
    ({
      id: 150,
      name: 180,
      hospitalId: 180,
      doctorId: 100,
      service: 170,
      status: 115,
      actions: 110,
      created: 130,
      updated: 140,
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
        className="app-table"
        size="small"
        hover
        bordered={false}
        tableLayout="fixed"
        rowKey="id"
        data={paginate ? rows.slice((page - 1) * 6, page * 6) : rows}
        columns={fields.map((c) => ({
          colKey: c.key,
          title: c.label,
          width: width(c.key),
          ellipsis: true,
          fixed:
            c.key === "actions"
              ? "right"
              : c.key === "id" && fields[0]?.key === "id"
                ? "left"
                : undefined,
          cell: c.render
            ? ({ row }: { row: Row }) => c.render!(row)
            : undefined,
        }))}
        pagination={
          paginate
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
        empty={<Empty description="暂无符合条件的记录" />}
      />
    </div>
  );
}
function Files({
  owner,
  value = [],
  onChange,
  readonly = false,
  onBusyChange,
}: {
  owner: string;
  value: Attachment[];
  onChange?: (v: Attachment[]) => void;
  readonly?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  return (
    <div className="sales-files">
      {!readonly && (
        <>
          <Upload
            autoUpload={false}
            files={[]}
            multiple
            disabled={busy}
            showUploadProgress={false}
            onSelectChange={async (files) => {
              setBusy(true);
              setError("");
              try {
                const added = [];
                for (const file of files)
                  added.push(await saveFile(owner, file));
                onChange?.([...value, ...added]);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Button theme="default" variant="outline" disabled={busy}>
              选择资料
            </Button>
          </Upload>
          <p>PDF / PNG / JPG / DICOM / NIfTI / ZIP / TXT，单文件≤20MB。</p>
        </>
      )}
      {busy && <span>正在保存文件…</span>}
      {error && (
        <p role="alert" className="sales-error">
          {error} 请重新选择文件重试。
        </p>
      )}
      {value.map((f) => (
        <div key={f.id}>
          <Button
            variant="text"
            onClick={() =>
              void openFile(owner, f).catch((e) =>
                MessagePlugin.error(e.message),
              )
            }
          >
            {f.name}
          </Button>
          <span>{(f.size / 1024).toFixed(1)} KB · 已保存在本浏览器</span>
          {!readonly && (
            <Button
              variant="text"
              onClick={() => onChange?.(value.filter((x) => x.id !== f.id))}
            >
              移除
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
export default function SalesWorkspace() {
  const auth = useAuth(),
    account = auth.user!,
    storage = useWorkspaceStorage();
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
      storage.setItem("sales-v1", JSON.stringify(data));
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
      const next = transition(data, c, admin);
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
            if (
              next.doctors.some((d) => d.id === did) ||
              (lead.phone && next.doctors.some((d) => d.phone === lead.phone))
            )
              continue;
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
                  title: "",
                  certificate: "",
                  status: "草稿",
                  owner: null,
                  materials: [],
                  reason: "",
                  source: lead.code,
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
    orders = visibleOrders(data),
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
        data.orders.find((o) => o.id === key)?.name ||
        data.doctors.find((d) => d.id === key)?.name ||
        key,
    );
  };
  const openEvent = (event: { id?: unknown; target: unknown }) => {
    if (event.id) commit({ type: "read", target: String(event.id) });
    const key = eventTarget(event.target);
    const order = data.orders.find((o) => o.id === key);
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
    { key: "name", label: "订单名称" },
    { key: "caseId", label: "病例编号" },
    {
      key: "hospitalId",
      label: "医院",
      render: (r: Row) => h(String(r.hospitalId)),
    },
    {
      key: "doctorId",
      label: "需求医生",
      render: (r: Row) => doc(String(r.doctorId)),
    },
    { key: "service", label: "服务类型" },
    {
      key: "status",
      label: "状态",
      render: (r: Row) => <Status value={String(r.status)} />,
    },
    {
      key: "created",
      label: "创建日期",
      render: (r: Row) => formatDate(String(r.created)),
    },
    {
      key: "updated",
      label: "最近更新",
      render: (r: Row) => formatDynamicTime(String(r.updated)),
    },
    {
      key: "due",
      label: "预计交付",
      render: (r: Row) => formatDate(String(r.due)),
    },
    {
      key: "actions",
      label: "操作",
      render: (r: Row) => (
        <Button
          variant="text"
          theme="primary"
          onClick={() => go("order/" + r.id)}
        >
          查看详情
        </Button>
      ),
    },
  ];
  const doctorFields = [
    { key: "name", label: "医生姓名" },
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
        const at = data.events.find((e) => e.target === r.id)?.at;
        return at ? formatDynamicTime(at) : "暂无记录";
      },
    },
    {
      key: "phone",
      label: "联系电话",
      render: (r: Row) =>
        r.phone ? String(r.phone).replace(/(\d{3})\d{4}/, "$1****") : "未提供",
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
        r.owner === account.id
          ? "已关联 · 李明"
          : r.owner
            ? "已有其他销售"
            : "待关联",
    },
    {
      key: "actions",
      label: "操作",
      render: (r: Row) => (
        <Button
          theme="primary"
          variant="text"
          onClick={() => go("doctor/" + r.id)}
        >
          查看详情
        </Button>
      ),
    },
  ];
  const matching = orders.filter(
    (o) =>
      (!search || [o.id, o.name, o.caseId].some((x) => x.includes(search))) &&
      (!filter || o.status === filter) &&
      (!hospitalFilter || o.hospitalId === hospitalFilter) &&
      (!deptFilter || o.department === deptFilter) &&
      (!serviceFilter || o.service === serviceFilter) &&
      (!from || formatDate(o.created) >= from) &&
      (!to || formatDate(o.created) <= to),
  );
  const filteredOrders =
    detail === "pending"
      ? matching.filter((o) => ["草稿", "待补资料"].includes(o.status))
      : detail === "processing"
        ? matching.filter((o) => o.status === "处理中")
        : detail === "confirming"
          ? matching.filter((o) => o.status === "待客户确认")
          : detail === "active"
            ? matching.filter((x) => m.active.some((o) => o.id === x.id))
            : detail === "todos"
              ? matching.filter((x) => m.todos.some((o) => o.id === x.id))
              : detail === "new"
                ? matching.filter((x) => m.newOrders.some((o) => o.id === x.id))
                : detail === "completed"
                  ? matching.filter((x) =>
                      m.completed.some((o) => o.id === x.id),
                    )
                  : matching;
  const todos = [
    ...data.doctors
      .filter((d) => ["草稿", "审核退回"].includes(d.status) && !d.owner)
      .map((d) => ({
        id: d.id,
        type: "医生资料" + d.status,
        name: d.name,
        hospital: h(d.hospitalId),
        at: data.events.find((e) => e.target === d.id)?.at || "",
        status: d.status,
      })),
    ...m.todos.map((o) => ({
      id: o.id,
      type: "订单" + o.status,
      name: o.name,
      hospital: h(o.hospitalId),
      at: o.updated,
      status: o.status,
    })),
  ];
  const todoFields = [
    { key: "type", label: "类型" },
    { key: "name", label: "关联业务" },
    { key: "hospital", label: "医院" },
    {
      key: "at",
      label: "产生时间",
      render: (r: Row) => (r.at ? formatDynamicTime(String(r.at)) : "暂无记录"),
    },
    {
      key: "status",
      label: "状态",
      render: (r: Row) => <Status value={String(r.status)} />,
    },
    {
      key: "actions",
      label: "操作",
      render: (r: Row) => (
        <Button
          variant="text"
          onClick={() =>
            go(
              (data.doctors.some((d) => d.id === r.id) ? "doctor/" : "order/") +
                r.id,
            )
          }
        >
          处理
        </Button>
      ),
    },
  ];
  const tools = (
    <div className="sales-filters">
      <Input
        clearable
        value={search}
        onChange={setSearch}
        placeholder="搜索编号、名称或病例"
      />
      <Select
        clearable
        value={filter || undefined}
        onChange={(v) => setFilter(String(v || ""))}
        placeholder="订单状态"
        options={orderStatuses.map((value) => ({ value, label: value }))}
      />
      <Select
        clearable
        placeholder="医院"
        value={hospitalFilter || undefined}
        onChange={(v) => {
          setHospitalFilter(String(v || ""));
          setDeptFilter("");
        }}
        options={data.hospitals.map((h) => ({ label: h.name, value: h.id }))}
      />
      <Select
        clearable
        placeholder="科室"
        value={deptFilter || undefined}
        onChange={(v) => setDeptFilter(String(v || ""))}
        options={[
          ...new Set(
            data.hospitals
              .filter((h) => !hospitalFilter || h.id === hospitalFilter)
              .flatMap((h) => h.departments),
          ),
        ].map((value) => ({ value, label: value }))}
      />
      <Select
        clearable
        placeholder="服务类型"
        value={serviceFilter || undefined}
        onChange={(v) => setServiceFilter(String(v || ""))}
        options={services.map((value) => ({ value, label: value }))}
      />
      <DatePicker
        placeholder="开始日期"
        value={from}
        onChange={(v) => setFrom(String(v))}
      />
      <DatePicker
        placeholder="结束日期"
        value={to}
        onChange={(v) => setTo(String(v))}
      />
      <Button
        onClick={() => {
          setSearch("");
          setFilter("");
          setHospitalFilter("");
          setDeptFilter("");
          setServiceFilter("");
          setFrom("");
          setTo("");
          if (route.startsWith("orders/")) go("orders");
        }}
      >
        重置筛选
      </Button>
    </div>
  );
  const logs = (tid?: string) =>
    data.events
      .filter((e) => !tid || e.target === tid)
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
  const header = (title: string, actions?: React.ReactNode) => (
    <div className="list-page-heading">
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
    const pending = orders.filter((o) =>
        ["草稿", "待补资料"].includes(o.status),
      ),
      processing = orders.filter((o) => o.status === "处理中"),
      confirming = orders.filter((o) => o.status === "待客户确认");
    const stats = [
      {
        label: "待处理订单",
        rows: pending,
        route: "pending",
        note: "待提交与资料补充",
        Icon: TaskFilledIcon,
        tone: "pending",
      },
      {
        label: "进行中订单",
        rows: processing,
        route: "processing",
        note: "专业设计处理中",
        Icon: WorkFilledIcon,
        tone: "progress",
      },
      {
        label: "待确认订单",
        rows: confirming,
        route: "confirming",
        note: "等待客户确认",
        Icon: TimeFilledIcon,
        tone: "review",
      },
      {
        label: "本月新增订单",
        rows: m.newOrders,
        route: "new",
        note: "本月创建",
        Icon: FileAddFilledIcon,
        tone: "returned",
      },
      {
        label: "本月已完成订单",
        rows: m.completed,
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
              今天有 {todos.length} 项业务需要处理，
              {orders.filter((o) => o.status === "待补资料").length}{" "}
              张订单等待资料补充。
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
              <div className="sales-actions-inline">
                <Button theme="primary" onClick={() => go("order-new")}>
                  新建订单
                </Button>
                <Button
                  theme="primary"
                  variant="text"
                  onClick={() => go("orders")}
                >
                  查看全部
                  <ChevronRightIcon size={15} />
                </Button>
              </div>
            </div>
            <Grid
              paginate={false}
              rows={[...orders]
                .sort((a, b) => b.updated.localeCompare(a.updated))
                .slice(0, 6)}
              fields={orderFields.filter((f) =>
                [
                  "id",
                  "hospitalId",
                  "name",
                  "doctorId",
                  "service",
                  "status",
                  "created",
                  "due",
                  "actions",
                ].includes(f.key),
              )}
            />
          </Card>
          <Card bordered={false} className="dashboard-card recent-card">
            <div className="section-heading">
              <h2>我的待办</h2>
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
              <h2>近期业务动态</h2>
              <Button
                variant="text"
                theme="primary"
                onClick={() => go("notifications")}
              >
                查看全部
              </Button>
            </div>
            <Grid
              paginate={false}
              rows={data.events.slice(0, 3)}
              fields={[
                { key: "title", label: "业务变化" },
                {
                  key: "detail",
                  label: "内容",
                  render: (r) =>
                    eventSummary({ target: r.target, detail: r.detail }),
                },
                {
                  key: "at",
                  label: "时间",
                  render: (r) => formatDynamicTime(String(r.at)),
                },
                {
                  key: "actions",
                  label: "操作",
                  render: (r) => (
                    <Button
                      variant="text"
                      theme="primary"
                      onClick={() => openEvent(r as Row & { target: unknown })}
                    >
                      查看详情
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </section>
      </div>
    );
  } else if (section === "todos")
    content = (
      <>
        <Back onClick={() => go("home")}>返回工作台</Back>
        <Card bordered={false} className="unified-list-card">
          {header("我的待办")}
          <Grid rows={todos} fields={todoFields} />
        </Card>
      </>
    );
  else if (section === "customers")
    content = (
      <Card bordered={false} className="unified-list-card">
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
        )}
        <div className="sales-filters">
          <Input clearable value={search} onChange={setSearch} placeholder="搜索医生姓名或手机号"/>
          <Select placeholder="全部医院" clearable value={hospitalFilter || undefined} options={data.hospitals.map(h=>({value:h.id,label:h.name}))} onChange={v=>{setHospitalFilter(String(v||""));setDeptFilter("");}}/>
          <Select placeholder="全部科室" clearable value={deptFilter || undefined} options={[...new Set(data.hospitals.filter(h=>!hospitalFilter||h.id===hospitalFilter).flatMap(h=>h.departments))].map(value=>({value,label:value}))} onChange={v=>setDeptFilter(String(v||""))}/>
          <Select placeholder="全部状态" clearable value={filter || undefined} options={["草稿","待审核","审核通过","审核退回"].map(value=>({value,label:value}))} onChange={v=>setFilter(String(v||""))}/>
          <Button theme="default" variant="outline" onClick={()=>{setSearch("");setHospitalFilter("");setDeptFilter("");setFilter("");}}>重置筛选</Button>
        </div>
        <Grid rows={data.doctors.filter(d=>(!d.owner||d.owner===account.id)&&data.hospitals.some(h=>h.id===d.hospitalId&&h.departments.includes(d.department))&&(d.name.includes(search)||d.phone.includes(search))&&(!hospitalFilter||d.hospitalId===hospitalFilter)&&(!deptFilter||d.department===deptFilter)&&(!filter||d.status===filter))} fields={doctorFields}/>
      </Card>
    );
  else if (section === "hospital") {
    const hospital = account.permissions.includes("hospital.directory.read") ? data.hospitals.find((h) => h.id === detail) : undefined;
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
        initial={data.doctors.find((d) => d.id === detail && (!d.owner || d.owner === account.id))}
        save={(d) => {
          if (commit({ type: "doctor-save", value: d })) go("doctor/" + d.id);
        }}
        cancel={() => go("customers/doctors")}
      />
    );
  else if (section === "doctor") {
    const d = data.doctors.find((d) => d.id === detail && (!d.owner || d.owner === account.id));
    content = d ? (
      <>
        <Back onClick={() => go("customers/doctors")}>返回客户管理</Back>
        <Card bordered={false} className="project-info-card">
          {header(
            d.name,
            <>
              {!d.owner || d.owner === account.id ? (
                <>
                  <Button
                    disabled={!["草稿", "审核退回"].includes(d.status)}
                    onClick={() => go("doctor-new/" + d.id)}
                  >
                    编辑资料
                  </Button>
                  <Button theme="primary" disabled={!["草稿","审核退回"].includes(d.status)||!d.name||!d.phone||!d.certificate||!d.materials.length} onClick={()=>commit({type:"doctor-submit",target:d.id})}>{d.status==="审核退回"?"重新提交审核":"提交审核"}</Button>
                </>
              ) : (
                <Button onClick={() => applyRequest("归属变更", d.id)}>
                  申请归属变更
                </Button>
              )}
            </>,
          )}

          <Status value={d.status} />
          <Tabs defaultValue="basic">
            <Tabs.TabPanel label="基本资料" value="basic">
              <dl className="project-info-grid">
                {[
                  ["医生姓名", d.name],
                  ["医院", h(d.hospitalId)],
                  ["科室", d.department],
                  ["职称", d.title],
                  ["联系电话", d.phone ? d.phone.replace(/(\d{3})\d{4}/,"$1****") : "未提供"],
                  ["执业证书编号", d.certificate || "未提供"],
                  ["建档来源",d.source],
                  ["最近更新",data.events.find(e=>e.target===d.id)?.at ? formatAuditTime(data.events.find(e=>e.target===d.id)!.at) : "暂无记录"],
                  [
                    "负责销售",
                    d.owner === account.id
                      ? account.name
                      : d.owner
                        ? "其他销售"
                        : "待关联",
                  ],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </Tabs.TabPanel>
            <Tabs.TabPanel value="files" label="资质材料">
              {d.owner && d.owner !== account.id ? (
                <Empty description="无资质附件访问权限" />
              ) : (
                <>
                  <p>证书编号：{d.certificate}</p>
                  <Files owner={account.id} value={d.materials} readonly />
                </>
              )}
            </Tabs.TabPanel>
            <Tabs.TabPanel value="orders" label="关联订单">
              <Grid
                rows={orders.filter((o) => o.doctorId === d.id)}
                fields={orderFields}
              />
              <h3>关联病例</h3>
              {data.cases
                .filter((c) => c.doctorId === d.id)
                .map((c) => (
                  <Button key={c.id} onClick={() => go("case/" + c.id)}>
                    {c.id}
                  </Button>
                ))}
              <Button
                disabled={d.owner !== account.id}
                onClick={() => {
                  setTarget(d.id);
                  setModal("新建病例");
                  setReason("");
                }}
              >
                新建病例
              </Button>
            </Tabs.TabPanel>
            <Tabs.TabPanel value="follow" label="业务跟进">
              <Button
                onClick={() => {
                  setTarget(d.id);
                  setModal("业务跟进");
                  setReason("");
                }}
              >
                记录跟进
              </Button>
              <ul className="timeline sales-log">{logs(d.id)}</ul>
            </Tabs.TabPanel>
            <Tabs.TabPanel value="reviews" label="审核记录">
              {d.reason && <p className="sales-error">{d.reason}</p>}
              <ul className="timeline sales-log">
                {data.events
                  .filter((e) => e.target === d.id && e.title.includes("审核"))
                  .map((e) => (
                    <li className="timeline-item" key={e.id}>
                      <i />
                      {e.title} · {formatAuditTime(e.at)} · {e.actor}
                      <p>{e.detail}</p>
                    </li>
                  ))}
              </ul>
            </Tabs.TabPanel>
          </Tabs>
        </Card>
      </>
    ) : (
      <Empty description="档案不存在" />
    );
  } else if (section === "orders")
    content = (
      <Card bordered={false} className="unified-list-card">
        {header(
          "订单管理",
          <>
            <Button
              variant="text"
              theme="primary"
              onClick={() => go("history")}
            >
              历史访问申请
            </Button>
            <Button theme="primary" onClick={() => go("order-new")}>
              新建订单
            </Button>
          </>,
        )}
        {tools}
        <div className="sales-list-table">
          <Grid rows={filteredOrders} fields={orderFields} />
        </div>
      </Card>
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
            ["草稿", "待补资料"].includes(o.status),
        )}
        doctorId={
          data.doctors.some((d) => d.id === detail) ? detail : undefined
        }
        caseId={caseRoute}
        createCase={(value) => commit({ type: "case-create", value })}
        save={(o, submit) => {
          try {
            let next = transition(data, { type: "order-save", value: o });
            if (submit)
              next = transition(next, { type: "order-submit", target: o.id });
            storage.setItem("sales-v1", JSON.stringify(next));
            setData(next);
            void MessagePlugin.success(
              submit ? "订单已提交，等待受理" : "草稿已保存",
            );
            go("order/" + o.id);
          } catch (e) {
            void MessagePlugin.error((e as Error).message);
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
        <Button onClick={() => applyRequest("历史访问", o.id)}>
          申请临时访问
        </Button>
      </Card>
    ) : (
      <>
        <Back onClick={() => go("orders")}>返回订单管理</Back>
        <Card bordered={false} className="project-info-card">
          {header(
            o.name,
            <>
              {["草稿", "待补资料"].includes(o.status) && (
                <Button theme="primary" onClick={() => go("order-new/" + o.id)}>
                  继续完善
                </Button>
              )}
            </>,
          )}

          <Status value={o.status} />
          <Tabs defaultValue="overview">
            <Tabs.TabPanel value="overview" label="订单概览">
              <dl className="project-info-grid">
                {[
                  ["订单名称", o.name],
                  ["最近更新时间", formatAuditTime(o.updated)],
                  ["订单编号", o.id],
                  ["病例编号", o.caseId],
                  ["医院", h(o.hospitalId)],
                  ["需求医生", doc(o.doctorId)],
                  ["科室", o.department],
                  ["业务服务项目", o.service],
                  ["数量", o.quantity],
                  ["预计交付", o.due],
                  ["创建日期", formatDate(o.created)],
                  ["需求", o.requirements],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {o.reason && <p className="sales-error">{o.reason}</p>}
            </Tabs.TabPanel>
            <Tabs.TabPanel value="progress" label="专业进度">
              {o.stages.length ? (
                o.stages.map((s) => (
                  <section className="project-stage" key={s.name}>
                    <div className="project-stage-title">
                      <h3>{s.name}</h3>
                      <Status value={s.status} />
                    </div>
                    <p>专业进度只读</p>
                  </section>
                ))
              ) : (
                <Empty description="尚未受理分配专业任务" />
              )}
            </Tabs.TabPanel>
            <Tabs.TabPanel value="files" label="资料附件">
              <Files owner={account.id} value={o.materials} readonly />
            </Tabs.TabPanel>
            <Tabs.TabPanel value="activity" label="操作记录">
              <ul className="timeline sales-log">{logs(o.id)}</ul>
            </Tabs.TabPanel>
          </Tabs>
        </Card>
      </>
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
    content = (
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
              ["orders", "订单管理", FileIcon],
              ["customers", "客户管理", UserCircleIcon],
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
              .filter((o) =>
                ["待受理", "处理中", "待客户确认"].includes(o.status),
              )
              .map((o) => (
                <div key={o.id}>
                  <p>
                    {o.id} · {o.status}
                  </p>
                  {(o.status === "待受理"
                    ? ["处理中", "待补资料", "已取消"]
                    : o.status === "处理中"
                      ? ["待客户确认"]
                      : ["已完成", "处理中"]
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
                        { type: "request-review", target: r.id, value: "退回" },
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
        { key: "newOwner", label: "申请销售", render: () => "李明" },
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
  save: (d: Doctor) => void;
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
      },
    ),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  const field = (key: keyof Doctor, label: string) => (
    <Field
      label={label}
      error={
        error &&
        ["name", "title"].includes(String(key)) &&
        !String(d[key]).trim()
          ? "请填写" + label
          : error && key === "phone" && d.phone && !/^1\d{10}$/.test(d.phone)
            ? "请输入有效的11位手机号"
            : undefined
      }
      requiredMark={key === "name" || key === "title"}
    >
      <>
        <Input
          value={String(d[key])}
          onChange={(v) => set({ ...d, [key]: v })}
        />
      </>
    </Field>
  );
  return (
    <>
      <Back onClick={cancel}>返回客户管理</Back>
      <Card bordered={false} className="project-info-card">
        <h2>{initial ? "编辑" : "新建"}医生档案</h2>
        <Form
          labelAlign="top"
          onSubmit={() => {
            if (
              !d.name.trim() ||
              !d.hospitalId ||
              !d.department ||
              !d.title.trim() ||
              (d.phone && !/^1\d{10}$/.test(d.phone))
            ) {
              setError("请完整填写姓名、医院、科室及职称。");
              return;
            }
            save(d);
          }}
        >
          {field("name", "真实姓名")}
          {field("phone", "联系手机号")}
          <Field
            label="授权医院"
            requiredMark
            error={error && !d.hospitalId ? "请选择医院" : undefined}
          >
            <>
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
            </>
          </Field>
          <Field
            label="科室"
            requiredMark
            error={error && !d.department ? "请选择科室" : undefined}
          >
            <>
              <Select
                value={d.department}
                options={(
                  data.hospitals.find((h) => h.id === d.hospitalId)
                    ?.departments || []
                ).map((value) => ({ value, label: value }))}
                onChange={(v) => set({ ...d, department: String(v) })}
              />
            </>
          </Field>
          {field("title", "职称 / 专业方向")}
          {field("certificate", "执业证书编号")}
          <p>负责销售：李明 · 安徽区域</p>
          <Field label="执业及身份证明资料">
            <>
              <Files
                owner={data.ownerId}
                onBusyChange={setUploading}
                value={d.materials}
                onChange={(materials) => set({ ...d, materials })}
              />
            </>
          </Field>
          {d.reason && <p className="sales-error">{d.reason}</p>}

          <Button type="submit" theme="primary" disabled={uploading}>
            保存草稿
          </Button>
        </Form>
      </Card>
    </>
  );
}
function OrderEditor({
  data,
  initial,
  doctorId,
  caseId,
  createCase,
  save,
  cancel,
}: {
  data: SalesData;
  initial?: Order;
  doctorId?: string;
  caseId?: string;
  createCase: (value: {
    id: string;
    doctorId: string;
    summary: string;
  }) => boolean;
  save: (o: Order, submit: boolean) => void;
  cancel: () => void;
}) {
  const [caseOpen, setCaseOpen] = useState(false),
    [caseSummary, setCaseSummary] = useState("");
  const [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false);
  const [o, set] = useState<Order>(() => {
    const d = data.doctors.find((d) => d.id === doctorId);
    return (
      initial || {
        id: "SO-" + id().slice(0, 8),
        name: "",
        caseId: caseId || "",
        doctorId: d?.id || "",
        hospitalId: d?.hospitalId || "",
        department: d?.department || "",
        service: services[0],
        quantity: 1,
        requirements: "",
        due: "",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        businessDate: new Date().toISOString(),
        status: "草稿",
        materials: [],
        reason: "",
        stages: [],
      }
    );
  });
  const next = () => {
    if (
      step === 0 &&
      (!o.name.trim() || !o.caseId || !o.doctorId || !o.requirements.trim())
    ) {
      setError("请完成客户、病例、名称及需求摘要。");
      return;
    }
    if (
      step === 1 &&
      (!o.due || !Number.isInteger(o.quantity) || o.quantity < 1)
    ) {
      setError("请填写有效数量及交付日期。");
      return;
    }
    if (step === 2 && !o.materials.length) {
      setError("请上传至少一份需求资料。");
      return;
    }
    setError("");
    setStep(step + 1);
  };
  return (
    <>
      <Back onClick={cancel}>返回订单管理</Back>
      <Card bordered={false} className="project-info-card">
        <h2>新建订单</h2>
        <Steps current={step}>
          {["客户与病例", "服务需求", "资料上传", "确认并提交"].map((title) => (
            <Steps.StepItem key={title} title={title} />
          ))}
        </Steps>
        <Form className="sales-order-form" labelAlign="top">
          {step === 0 && (
            <>
              <Field
                label="医院"
                error={error && !o.hospitalId ? "请完成医院" : undefined}
                requiredMark
              >
                <>
                  <Select
                    value={o.hospitalId}
                    options={data.hospitals.map((h) => ({
                      value: h.id,
                      label: h.name,
                    }))}
                    onChange={(v) =>
                      set({
                        ...o,
                        hospitalId: String(v),
                        department: "",
                        doctorId: "",
                        caseId: "",
                      })
                    }
                  />
                </>
              </Field>
              <Field
                label="科室"
                error={error && !o.department ? "请完成科室" : undefined}
                requiredMark
              >
                <>
                  <Select
                    value={o.department}
                    options={(
                      data.hospitals.find((h) => h.id === o.hospitalId)
                        ?.departments || []
                    ).map((value) => ({ value, label: value }))}
                    onChange={(v) =>
                      set({
                        ...o,
                        department: String(v),
                        doctorId: "",
                        caseId: "",
                      })
                    }
                  />
                </>
              </Field>
              <Field
                label="需求医生"
                error={error && !o.doctorId ? "请完成需求医生" : undefined}
                requiredMark
              >
                <>
                  <Select
                    value={o.doctorId}
                    options={data.doctors
                      .filter(
                        (d) =>
                          d.owner === data.ownerId &&
                          d.status === "审核通过" &&
                          d.hospitalId === o.hospitalId &&
                          d.department === o.department,
                      )
                      .map((d) => ({ value: d.id, label: d.name }))}
                    onChange={(v) =>
                      set({ ...o, doctorId: String(v), caseId: "" })
                    }
                  />
                </>
              </Field>
              <Field
                label="已有病例"
                error={error && !o.caseId ? "请完成已有病例" : undefined}
                requiredMark
              >
                <>
                  <Select
                    value={o.caseId}
                    options={data.cases
                      .filter((c) => c.doctorId === o.doctorId)
                      .map((c) => ({ value: c.id, label: c.id }))}
                    onChange={(v) => set({ ...o, caseId: String(v) })}
                  />
                </>
              </Field>
              <Button disabled={!o.doctorId} onClick={() => setCaseOpen(true)}>
                新建病例
              </Button>
              <p>新订单仅关联病例信息。</p>
              <Field
                label="订单名称"
                error={error && !o.name ? "请完成订单名称" : undefined}
                requiredMark
              >
                <>
                  <Input
                    value={o.name}
                    onChange={(v) => set({ ...o, name: v })}
                  />
                </>
              </Field>
              <Field
                label="临床需求摘要"
                error={
                  error && !o.requirements ? "请完成临床需求摘要" : undefined
                }
                requiredMark
              >
                <>
                  <Input
                    value={o.requirements}
                    onChange={(v) => set({ ...o, requirements: v })}
                  />
                </>
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field
                label="服务项目"
                error={error && !o.service ? "请完成服务项目" : undefined}
              >
                <>
                  <Select
                    value={o.service}
                    options={services.map((value) => ({ value, label: value }))}
                    onChange={(v) => set({ ...o, service: String(v) })}
                  />
                </>
              </Field>
              <Field
                label="需求数量"
                requiredMark
                error={
                  error && (!Number.isInteger(o.quantity) || o.quantity < 1)
                    ? "请输入正整数"
                    : undefined
                }
              >
                <>
                  <Input
                    type="number"
                    value={String(o.quantity)}
                    onChange={(v) => set({ ...o, quantity: Number(v) })}
                  />
                </>
              </Field>
              <Field
                label="预计交付日期"
                requiredMark
                error={error && !o.due ? "请完成预计交付日期" : undefined}
              >
                <>
                  <DatePicker
                    value={o.due}
                    onChange={(v) => set({ ...o, due: String(v) })}
                  />
                </>
              </Field>
              <Field label="设计用途与特殊说明">
                <>
                  <Input
                    value={o.requirements}
                    onChange={(v) => set({ ...o, requirements: v })}
                  />
                </>
              </Field>
            </>
          )}
          {step === 2 && (
            <Files
              owner={data.ownerId}
              onBusyChange={setUploading}
              value={o.materials}
              onChange={(materials) => set({ ...o, materials })}
            />
          )}{" "}
          {step === 3 && (
            <dl className="project-info-grid">
              {[
                [
                  "医院",
                  data.hospitals.find((h) => h.id === o.hospitalId)?.name,
                ],
                [
                  "需求医生",
                  data.doctors.find((d) => d.id === o.doctorId)?.name,
                ],
                ["病例编号", o.caseId],
                ["订单名称", o.name],
                ["服务项目", o.service],
                ["数量", o.quantity],
                ["预计交付", o.due],
                ["临床需求", o.requirements],
                ["资料", o.materials.map((f) => f.name).join("、")],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {step === 2 && error && !o.materials.length && (
            <p className="sales-error" role="alert">
              请上传至少一份需求资料。
            </p>
          )}
          <div className="sales-actions">
            {step > 0 && (
              <Button
                theme="default"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                上一步
              </Button>
            )}
            <Button
              theme="default"
              variant="outline"
              disabled={uploading}
              onClick={() => save(o, false)}
            >
              保存草稿
            </Button>
            {step < 3 ? (
              <Button theme="primary" onClick={next} disabled={uploading}>
                下一步
              </Button>
            ) : (
              <Button
                theme="primary"
                onClick={() => save(o, true)}
                disabled={uploading}
              >
                提交订单
              </Button>
            )}
          </div>
        </Form>
      </Card>
      <Dialog
        visible={caseOpen}
        header="新建病例"
        onClose={() => setCaseOpen(false)}
        onConfirm={() => {
          const c = {
            id: "CASE-" + id().slice(0, 8),
            doctorId: o.doctorId,
            summary: caseSummary,
          };
          if (createCase(c)) {
            set({ ...o, caseId: c.id });
            setCaseSummary("");
            setCaseOpen(false);
          }
        }}
      >
        <Input
          value={caseSummary}
          onChange={setCaseSummary}
          placeholder="填写脱敏病例需求摘要"
        />
      </Dialog>
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
