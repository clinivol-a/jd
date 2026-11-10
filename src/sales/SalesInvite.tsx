import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  Input,
  Select,
  QRCode,
  MessagePlugin,
  Empty,
} from "tdesign-react";
import type { Hospital } from "./model";
export type InviteLead = {
  id: string;
  name: string;
  phone: string;
  hospitalId: string;
  department: string;
  code: string;
  at: string;
};
async function request(path: string, body?: unknown) {
  const r = await fetch("/api/sales-demo/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error || "邀请服务不可用。");
  return result;
}
export async function readInviteLeads(): Promise<InviteLead[]> {
  return (await request("leads")).leads;
}
export function SalesInviteDialog({
  visible,
  onClose,
  hospitals,
}: {
  visible: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  count: number;
  pending: number;
}) {
  const [invite, setInvite] = useState<{
      code: string;
      url: string;
      lan: boolean;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (visible) {
      setError("");
      void request("invite", { hospitals })
        .then(setInvite)
        .catch((e) => setError(e.message));
    }
  }, [visible]);
  return (
    <Dialog
      visible={visible}
      header="我的专属码"
      footer={false}
      onClose={onClose}
    >
      <div className="sales-invite"><p>邀请医生完善建档资料</p>
        {invite ? (
          <>
            <QRCode value={invite.url} size={196} type="svg" />
            <p>邀请码：{invite.code}</p>
            <p className="sales-invite-url">{invite.url}</p>
            <Button theme="primary"
              onClick={() =>
                void navigator.clipboard
                  .writeText(invite.url)
                  .then(() => MessagePlugin.success("邀请链接已复制"))
                  .catch(() =>
                    MessagePlugin.error("无法复制，请手动复制链接。"),
                  )
              }
            >
              复制链接
            </Button>
            <a href={invite.url} target="_blank" rel="noreferrer">
              打开邀请入口
            </a>
          </>
        ) : (
          <Empty description={error || "正在读取邀请入口…"} />
        )}
      </div>
    </Dialog>
  );
}
export function SalesInvitePage() {
  const token = new URLSearchParams(location.search).get("token") || "";
  const [info, setInfo] = useState<{
      salesName: string;
      code: string;
      hospitals: Hospital[];
    } | null>(null),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [hospital, setHospital] = useState(""),
    [department, setDepartment] = useState(""),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    void request("public?token=" + encodeURIComponent(token))
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [token]);
  return (
    <main className="sales-invite-page">
      <img src="/assets/clinivol-logo-light.png" alt="科立沃" />
      <h1>{done ? "联系信息已提交" : "医生联系信息"}</h1>
      {done ? (
        <p>销售将联系您补充资质资料。关联关系须经管理员审核确认。</p>
      ) : (
        <>
          <p>
            负责销售：{info?.salesName} · 来源：{info?.code}
          </p>
          <p>本地隔离流程仅使用合成信息，不上传真实证件。</p>
          <label>
            姓名
            <Input value={name} onChange={setName} />
          </label>
          <label>
            联系电话
            <Input value={phone} onChange={setPhone} />
          </label>
          <label>
            医院
            <Select
              value={hospital}
              options={
                info?.hospitals.map((h) => ({ value: h.id, label: h.name })) ||
                []
              }
              onChange={(v) => {
                setHospital(String(v));
                setDepartment("");
              }}
            />
          </label>
          <label>
            科室
            <Select
              value={department}
              options={(
                info?.hospitals.find((h) => h.id === hospital)?.departments ||
                []
              ).map((value) => ({ value, label: value }))}
              onChange={(v) => setDepartment(String(v))}
            />
          </label>
          {error && (
            <p className="sales-error" role="alert">
              {error}
            </p>
          )}
          <Button
            theme="primary"
            block
            disabled={!info}
            onClick={() =>
              void request("public?token=" + encodeURIComponent(token), {
                name,
                phone,
                hospitalId: hospital,
                department,
              })
                .then(() => setDone(true))
                .catch((e) => setError(e.message))
            }
          >
            提交联系信息
          </Button>
        </>
      )}
    </main>
  );
}
