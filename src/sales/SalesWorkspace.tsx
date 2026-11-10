import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Dialog,
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
  AssignmentErrorFilledIcon,
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
      style={
        value === "处理中"
          ? {
              color: "var(--cv-info-color)",
              background: "var(--cv-info-color-light)",
            }
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
  useEffect(() => setPage(1), [rows.length]);
  return (
    <Table
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
        width: c.key === "actions" ? 140 : undefined,
        ellipsis: true,
        cell: c.render ? ({ row }: { row: Row }) => c.render!(row) : undefined,
      }))}
      pagination={
        paginate
          ? {
              current: page,
              pageSize: 6,
              total: rows.length,
              showJumper: true,
              showPageSize: false,
              onCurrentChange: setPage,
            }
          : undefined
      }
      empty={<Empty description="暂无符合条件的记录" />}
    />
  );
}
function Files({
  owner,
  value = [],
  onChange,
  readonly = false,
}: {
  owner: string;
  value: Attachment[];
  onChange?: (v: Attachment[]) => void;
  readonly?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="sales-files">
      {!readonly && (
        <>
          <label className="sales-upload">
            选择资料
            <input
              aria-label="选择资料文件"
              type="file"
              multiple
              disabled={busy}
              onChange={async (e) => {
                const files = Array.from(e.currentTarget.files || []);
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
            />
          </label>
          <p>
            本浏览器保存，PDF / PNG / JPG / DICOM / NIfTI / ZIP /
            TXT，单文件≤20MB。仅上传合成资料。
          </p>
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
  const [data, setData] = useState<SalesData>(() => {
    try {
      const d = JSON.parse(storage.getItem("sales-v1") || "null");
      if (d?.schema === 1 && d.ownerId === account.id) return d;
    } catch {}
    return seedSales(account.id);
  });
  useEffect(() => {
    try {
      if (!storage.getItem("sales-v1"))
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
  const go = (r: string) => {
    setRoute(r);
    location.hash = "sales/" + r;
  };
  useEffect(() => {
    if (!location.hash.startsWith("#sales/"))
      history.replaceState(null, "", "#sales/" + route);
  }, []);
  useEffect(() => {
    const sync = () => {
      if (location.hash.startsWith("#sales/")) {
        setRoute(location.hash.slice(7));
        setSearch("");
        setFilter("");
        setHospitalFilter("");
        setDeptFilter("");
        setServiceFilter("");
        setFrom("");
        setTo("");
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
  const user = { ...account, role: roleName(account) };
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
      label: "预期交付",
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
      label: "最近业务",
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
      label: "资质审核",
      render: (r: Row) => <Status value={String(r.status)} />,
    },
    {
      key: "owner",
      label: "销售关联",
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
        <li key={e.id}>
          <strong>{e.title}</strong>
          <p>
            {formatAuditTime(e.at)} · {e.actor} {e.detail}
          </p>
        </li>
      ));
  const header = (title: string, actions?: React.ReactNode) => (
    <div className="sales-heading">
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
        Icon: AssignmentErrorFilledIcon,
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
      <div className="dashboard-page sales-dashboard">
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
            {new Intl.DateTimeFormat("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            }).format(new Date())}
          </time>
        </section>
        <section className="stat-grid" aria-label="销售订单统计">
          {stats.map(({ label, rows, route, note, Icon, tone }) => (
            <div key={route} className="sales-stat-activator"
              role="button"
              tabIndex={0}
              aria-label={label + " " + rows.length}
              onClick={() => go("orders/" + route)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go("orders/" + route);
                }
              }}
            ><Card bordered={false} className={"stat-card stat-"+tone}>
              <div className="stat-card-head">
                <span>{label}</span>
                <i>
                  <Icon size={20} />
                </i>
              </div>
              <strong>{rows.length}</strong>
              <small>{note}</small>
            </Card></div>
          ))}
        </section>
        <section className="dashboard-grid">
          <Card bordered={false} className="dashboard-card task-card">
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
              rows={todos.slice(0, 6)}
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
              rows={data.events.slice(0, 6)}
              fields={[
                { key: "title", label: "业务变化" },
                { key: "detail", label: "内容" },
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
                      onClick={() =>
                        go(
                          data.orders.some((o) => o.id === r.target)
                            ? "order/" + r.target
                            : "doctor/" + r.target,
                        )
                      }
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
        {header(
          "我的待办",
          <Button onClick={() => go("home")}>返回工作台</Button>,
        )}
        <Card>
          <Grid rows={todos} fields={todoFields} />
        </Card>
      </>
    );
  else if (section === "customers")
    content = (
      <>
        {header(
          "客户管理",
          <>
            <Button onClick={() => setModal("专属码")}>我的专属码</Button>
            <Button theme="primary" onClick={() => go("doctor-new")}>
              新建医生档案
            </Button>
          </>,
        )}
        <Tabs
          value={detail || "hospitals"}
          onChange={(v) => go("customers/" + v)}
        >
          <Tabs.TabPanel value="hospitals" label="医院客户" />
          <Tabs.TabPanel value="doctors" label="医生档案" />
          <Tabs.TabPanel value="linked" label="我的关联医生" />
          <Tabs.TabPanel value="requests" label="建档与关联申请" />
        </Tabs>
        <div className="sales-filters">
          <Input
            clearable
            value={search}
            onChange={setSearch}
            placeholder="搜索医院或医生"
          />
          <Select
            clearable
            placeholder="科室"
            value={deptFilter || undefined}
            onChange={(v) => setDeptFilter(String(v || ""))}
            options={[
              ...new Set(data.hospitals.flatMap((h) => h.departments)),
            ].map((value) => ({ value, label: value }))}
          />
          <Select
            clearable
            placeholder="资质审核状态"
            value={filter || undefined}
            onChange={(v) => setFilter(String(v || ""))}
            options={["草稿", "待审核", "审核通过", "审核退回"].map(
              (value) => ({ value, label: value }),
            )}
          />
        </div>
        <Card>
          {detail === "requests" ? (
            <>
              <h3>专属码待建档</h3>
              <Grid
                rows={data.doctors.filter(
                  (d) => d.source.startsWith("CV-SALES-") && !d.owner,
                )}
                fields={doctorFields}
              />
              <h3>关联审批申请</h3>
              <RequestList data={data} />
            </>
          ) : detail === "doctors" || detail === "linked" ? (
            <Grid
              rows={data.doctors.filter(
                (d) =>
                  (detail !== "linked" || d.owner === account.id) &&
                  d.name.includes(search) &&
                  (!filter || d.status === filter) &&
                  (!deptFilter || d.department === deptFilter),
              )}
              fields={doctorFields}
            />
          ) : (
            <Grid
              rows={data.hospitals
                .filter(
                  (h) =>
                    h.name.includes(search) &&
                    (!deptFilter || h.departments.includes(deptFilter)),
                )
                .map((h) => ({
                  ...h,
                  owner: "李明",
                  doctors: data.doctors.filter((d) => d.hospitalId === h.id)
                    .length,
                  count: orders.filter(
                    (o) => o.hospitalId === h.id && o.status === "处理中",
                  ).length,
                  departmentsCount: h.departments.length,
                }))}
              fields={[
                { key: "name", label: "医院名称" },
                { key: "region", label: "区域" },
                { key: "id", label: "医院编号" },
                { key: "owner", label: "负责销售" },
                { key: "departmentsCount", label: "科室数" },
                { key: "doctors", label: "医生数" },
                { key: "count", label: "处理中订单" },
                {
                  key: "recent",
                  label: "最近业务",
                  render: (r) => {
                    const at = orders
                      .filter((o) => o.hospitalId === r.id)
                      .map((o) => o.updated)
                      .sort()
                      .at(-1);
                    return at ? formatDynamicTime(at) : "暂无记录";
                  },
                },
                {
                  key: "actions",
                  label: "操作",
                  render: (r) => (
                    <Button
                      variant="text"
                      onClick={() => go("hospital/" + r.id)}
                    >
                      查看详情
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </Card>
      </>
    );
  else if (section === "hospital") {
    const hospital = data.hospitals.find((h) => h.id === detail);
    content = hospital ? (
      <>
        {header(
          hospital.name,
          <Button onClick={() => go("customers")}>返回客户管理</Button>,
        )}
        <Card>
          <p>
            编号：{hospital.id} · {hospital.region} · 负责销售：李明
          </p>
          <p>授权科室：{hospital.departments.join("、")}</p>
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
        initial={data.doctors.find((d) => d.id === detail)}
        save={(d) => {
          if (commit({ type: "doctor-save", value: d })) go("doctor/" + d.id);
        }}
        cancel={() => go("customers/doctors")}
      />
    );
  else if (section === "doctor") {
    const d = data.doctors.find((d) => d.id === detail);
    content = d ? (
      <>
        {header(
          d.name,
          <>
            <Button onClick={() => go("customers/doctors")}>
              返回医生档案
            </Button>
            {!d.owner || d.owner === account.id ? (
              <>
                <Button
                  disabled={!["草稿", "审核退回"].includes(d.status)}
                  onClick={() => go("doctor-new/" + d.id)}
                >
                  编辑资料
                </Button>
                <Button
                  theme="primary"
                  disabled={d.status !== "审核通过" || d.owner !== account.id}
                  onClick={() => go("order-new/" + d.id)}
                >
                  创建订单
                </Button>
              </>
            ) : (
              <Button onClick={() => applyRequest("归属变更", d.id)}>
                申请归属变更
              </Button>
            )}
          </>,
        )}
        <Card>
          <Status value={d.status} />
          <Tabs defaultValue="basic">
            <Tabs.TabPanel label="基本资料" value="basic">
              <p>
                {h(d.hospitalId)} · {d.department} · {d.title}
              </p>
              <p>
                手机号：
                {d.phone ? d.phone.replace(/(\d{3})\d{4}/, "$1****") : "未提供"}
              </p>
              <p>
                关联：
                {d.owner === account.id
                  ? "李明"
                  : d.owner
                    ? "其他销售"
                    : "待关联"}{" "}
                · 来源：{d.source}
              </p>
              <Button
                disabled={!["草稿", "审核退回"].includes(d.status)}
                onClick={() => commit({ type: "doctor-submit", target: d.id })}
              >
                提交审核
              </Button>
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
              <ul className="sales-log">{logs(d.id)}</ul>
            </Tabs.TabPanel>
            <Tabs.TabPanel value="reviews" label="审核记录">
              {d.reason && <p className="sales-error">{d.reason}</p>}
              <ul className="sales-log">
                {data.events
                  .filter((e) => e.target === d.id && e.title.includes("审核"))
                  .map((e) => (
                    <li key={e.id}>
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
      <>
        {header(
          "我的订单",
          <>
            <Button onClick={() => go("history")}>历史访问申请</Button>
            <Button theme="primary" onClick={() => go("order-new")}>
              新建订单
            </Button>
          </>,
        )}
        {tools}
        <Card>
          <Grid rows={filteredOrders} fields={orderFields} />
        </Card>
      </>
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
        <Button onClick={() => go("orders")}>返回订单</Button>
      </Card>
    ) : (
      <>
        {header(
          o.name,
          <>
            <Button onClick={() => go("orders")}>返回订单</Button>
            {["草稿", "待补资料"].includes(o.status) && (
              <Button theme="primary" onClick={() => go("order-new/" + o.id)}>
                继续完善
              </Button>
            )}
          </>,
        )}
        <Card>
          <Status value={o.status} />
          <Tabs defaultValue="overview">
            <Tabs.TabPanel value="overview" label="订单概览">
              <div className="sales-info">
                {[
                  ["订单编号", o.id],
                  ["病例编号", o.caseId],
                  ["医院", h(o.hospitalId)],
                  ["需求医生", doc(o.doctorId)],
                  ["服务", o.service],
                  ["数量", o.quantity],
                  ["预期交付", o.due],
                  ["创建日期", formatDate(o.created)],
                  ["需求", o.requirements],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              {o.reason && <p className="sales-error">{o.reason}</p>}
              <Button onClick={() => go("case/" + o.caseId)}>
                查看病例与关联订单
              </Button>
            </Tabs.TabPanel>
            <Tabs.TabPanel value="progress" label="专业进度">
              {o.stages.length ? (
                o.stages.map((s) => (
                  <div className="sales-progress-row" key={s.name}>
                    {s.name}
                    <Status value={s.status} />
                  </div>
                ))
              ) : (
                <Empty description="尚未受理分配专业任务" />
              )}
            </Tabs.TabPanel>
            <Tabs.TabPanel value="files" label="资料附件">
              <Files owner={account.id} value={o.materials} readonly />
            </Tabs.TabPanel>
            <Tabs.TabPanel value="delivery" label="交付与确认">
              <ul className="sales-log">{logs(o.id)}</ul>
              {!data.events.some((e) => e.target === o.id) && (
                <Empty description="暂无交付确认记录" />
              )}
            </Tabs.TabPanel>
            <Tabs.TabPanel value="activity" label="操作记录">
              <Button
                onClick={() => {
                  setTarget(o.id);
                  setModal("业务跟进");
                  setReason("");
                }}
              >
                记录业务跟进
              </Button>
              <ul className="sales-log">{logs(o.id)}</ul>
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
        {header(
          c.id,
          <Button
            theme="primary"
            onClick={() => go("order-new/" + c.doctorId + "/" + c.id)}
          >
            为本病例新建订单
          </Button>,
        )}
        <Card>
          <p>
            {c.summary} · {doc(c.doctorId)}
          </p>
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
        {header(
          "历史订单访问申请",
          <Button onClick={() => go("orders")}>返回订单</Button>,
        )}
        <Card>
          <p>
            当前窗口：最近{data.policy.months}
            个月；日期口径为隔离演示配置，正式业务口径待确认。
          </p>
          <Grid
            rows={data.orders
              .filter((o) => !canReadOrder(data, o))
              .map((o) => ({ id: o.id, status: o.status }))}
            fields={[
              { key: "id", label: "受限订单编号" },
              { key: "status", label: "处理状态" },
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
      <>
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
        <Card title="自然月业务量">
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
        </Card>
      </>
    );
  } else if (section === "notifications")
    content = (
      <>
        {header("消息通知")}
        <Card>
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
                      commit({ type: "read", target: String(r.id) });
                      const tid = String(r.target);
                      go(
                        data.orders.some((o) => o.id === tid)
                          ? "order/" + tid
                          : data.doctors.some((d) => d.id === tid)
                            ? "doctor/" + tid
                            : "customers/requests",
                      );
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
        onNotifications={() => go("notifications")}
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
        <main>{content}</main>
      </div>
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
    [error, setError] = useState("");
  const field = (key: keyof Doctor, label: string) => (
    <Form.FormItem
      label={label}
      requiredMark={key === "name" || key === "title"}
    >
      <>
        <Input
          value={String(d[key])}
          onChange={(v) => set({ ...d, [key]: v })}
        />
      </>
    </Form.FormItem>
  );
  return (
    <>
      <div className="sales-heading">
        <h1>{initial ? "编辑" : "新建"}医生档案</h1>
        <Button onClick={cancel}>返回医生档案</Button>
      </div>
      <Card>
        <Form
          labelAlign="top"
          onSubmit={() => {
            if (!d.name || !d.hospitalId || !d.department || !d.title) {
              setError("请完整填写姓名、医院、科室及职称。");
              return;
            }
            save(d);
          }}
        >
          {field("name", "真实姓名")}
          {field("phone", "联系手机号")}
          <Form.FormItem label="授权医院" requiredMark>
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
          </Form.FormItem>
          <Form.FormItem label="科室" requiredMark>
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
          </Form.FormItem>
          {field("title", "职称 / 专业方向")}
          {field("certificate", "执业证书编号")}
          <p>负责销售：李明 · 安徽区域</p>
          <Form.FormItem label="执业及身份证明资料">
            <>
              <Files
                owner={data.ownerId}
                value={d.materials}
                onChange={(materials) => set({ ...d, materials })}
              />
            </>
          </Form.FormItem>
          {d.reason && <p className="sales-error">{d.reason}</p>}
          {error && (
            <p role="alert" className="sales-error">
              {error}
            </p>
          )}
          <Button type="submit" theme="primary">
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
    [error, setError] = useState("");
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
      (!o.name || !o.caseId || !o.doctorId || !o.requirements)
    ) {
      setError("请完成客户、病例、名称及需求摘要。");
      return;
    }
    if (step === 1 && (!o.due || o.quantity < 1)) {
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
      {
        <div className="sales-heading">
          <h1>新建订单</h1>
          <Button onClick={cancel}>返回订单</Button>
        </div>
      }
      <Card>
        <Steps current={step}>
          {["客户与病例", "服务需求", "资料上传", "确认并提交"].map((title) => (
            <Steps.StepItem key={title} title={title} />
          ))}
        </Steps>
        <Form className="sales-order-form" labelAlign="top">
          {step === 0 && (
            <>
              <Form.FormItem label="医院" requiredMark>
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
              </Form.FormItem>
              <Form.FormItem label="科室" requiredMark>
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
              </Form.FormItem>
              <Form.FormItem label="需求医生" requiredMark>
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
              </Form.FormItem>
              <Form.FormItem label="已有病例" requiredMark>
                <>
                  <Select
                    value={o.caseId}
                    options={data.cases
                      .filter((c) => c.doctorId === o.doctorId)
                      .map((c) => ({ value: c.id, label: c.id }))}
                    onChange={(v) => set({ ...o, caseId: String(v) })}
                  />
                </>
              </Form.FormItem>
              <Button disabled={!o.doctorId} onClick={() => setCaseOpen(true)}>
                新建病例
              </Button>
              <p>仅关联病例信息，不自动复制历史影像或审核成果。</p>
              <Form.FormItem label="订单名称" requiredMark>
                <>
                  <Input
                    value={o.name}
                    onChange={(v) => set({ ...o, name: v })}
                  />
                </>
              </Form.FormItem>
              <Form.FormItem label="临床需求摘要" requiredMark>
                <>
                  <Input
                    value={o.requirements}
                    onChange={(v) => set({ ...o, requirements: v })}
                  />
                </>
              </Form.FormItem>
            </>
          )}
          {step === 1 && (
            <>
              <Form.FormItem label="服务项目">
                <>
                  <Select
                    value={o.service}
                    options={services.map((value) => ({ value, label: value }))}
                    onChange={(v) => set({ ...o, service: String(v) })}
                  />
                </>
              </Form.FormItem>
              <Form.FormItem label="需求数量">
                <>
                  <Input
                    type="number"
                    value={String(o.quantity)}
                    onChange={(v) => set({ ...o, quantity: Number(v) })}
                  />
                </>
              </Form.FormItem>
              <Form.FormItem label="预期交付日期">
                <>
                  <DatePicker
                    value={o.due}
                    onChange={(v) => set({ ...o, due: String(v) })}
                  />
                </>
              </Form.FormItem>
              <Form.FormItem label="设计用途与特殊说明">
                <>
                  <Input
                    value={o.requirements}
                    onChange={(v) => set({ ...o, requirements: v })}
                  />
                </>
              </Form.FormItem>
            </>
          )}
          {step === 2 && (
            <Files
              owner={data.ownerId}
              value={o.materials}
              onChange={(materials) => set({ ...o, materials })}
            />
          )}{" "}
          {step === 3 && (
            <div className="sales-info">
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
                ["预期交付", o.due],
                ["临床需求", o.requirements],
                ["资料", o.materials.map((f) => f.name).join("、")],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}
          {error && (
            <p className="sales-error" role="alert">
              {error}
            </p>
          )}
          <div className="sales-actions">
            {step > 0 && (
              <Button onClick={() => setStep(step - 1)}>上一步</Button>
            )}
            <Button onClick={() => save(o, false)}>保存草稿</Button>
            {step < 3 ? (
              <Button theme="primary" onClick={next}>
                下一步
              </Button>
            ) : (
              <Button theme="primary" onClick={() => save(o, true)}>
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
