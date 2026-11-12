import { useEffect, useState, useRef } from "react";
import {
  Button,
  Dialog,
  Input,
  Select,
  QRCode,
  MessagePlugin,
  Empty,
  Form,
} from "tdesign-react";
import { SalesAttachments } from "./SalesAttachments";
import type { Attachment } from "./model";
import type { Hospital } from "./model";
export type InviteLead = {
  id: string;
  name: string;
  phone: string;
  hospitalId: string;
  department: string;
  code: string;
  at: string;
  title?: string;
  certificate?: string;
  materials?: Attachment[];
  phoneVerified?: boolean;
  submittedBy?: string;
  submissionMode?: string;
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
      <div className="sales-invite">

        {invite ? (
          <>
            <QRCode value={invite.url} size={196} type="svg" />
            <p>微信扫码填写医生建档资料。</p>
            <p>也可复制链接，通过浏览器填写。</p>
            <div className="sales-invite-actions"><Button theme="default" variant="outline" onClick={()=>{const url=new URL(invite.url);url.host=location.host;url.protocol=location.protocol;url.searchParams.set("assisted","1");window.open(url.href,"_blank","noopener,noreferrer");}}>打开邀请入口</Button>
            <Button
              theme="primary"
              onClick={() =>
                void navigator.clipboard
                  .writeText(invite.url)
                  .then(() => MessagePlugin.success("邀请链接已复制"))
                  .catch(() =>
                    MessagePlugin.error("无法复制，请检查浏览器剪贴板权限后重试。"),
                  )
              }
            >
              复制链接
            </Button>

            </div>
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
  const assisted = new URLSearchParams(location.search).get("assisted") === "1";
  const [info, setInfo] = useState<{
      salesName: string;
      code: string;
      hospitals: Hospital[];
    } | null>(null),
    [error, setError] = useState("");
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [code, setCode] = useState(""),
    [proof, setProof] = useState(""),
    [phoneMessage, setPhoneMessage] = useState(""),
    [phoneError, setPhoneError] = useState(false),
    [hospital, setHospital] = useState(""),
    [department, setDepartment] = useState(""),
    [title, setTitle] = useState(""),
    [certificate, setCertificate] = useState(""),
    [materials, setMaterials] = useState<Attachment[]>([]),
    [busySlots, setBusySlots] = useState<Record<string, boolean>>({}),
    [done, setDone] = useState(false),
    [tried, setTried] = useState(false);
  const [submitting, setBusy] = useState(false);
  const busy = submitting || Object.values(busySlots).some(Boolean);
  const setUploadBusy = (slot: string, value: boolean) =>
    setBusySlots((previous) => ({ ...previous, [slot]: value }));
  const blobs = useRef(new Map<string, Blob>());
  const path = (action: string) =>
    action + "?token=" + encodeURIComponent(token);
  useEffect(() => {
    void request(path("public"))
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [token]);
  const upload = async (file: File, category: Attachment["category"]) => {
    const content = await new Promise<string>((ok, no) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result).split(",")[1]);
      r.onerror = () => no(Error("文件读取失败，请重试。"));
      r.readAsDataURL(file);
    });
    const stored = await request(path("public-upload"), {
      proof,
      assisted,
      name,
      file: { name: file.name, type: file.type, category, content },
    });
    blobs.current.set(stored.id, file);
    return stored;
  };
  const load = async (file: Attachment) => {
    const blob = blobs.current.get(file.id);
    if (!blob) throw Error("当前页面未保留此预览文件。");
    return blob;
  };
  const PhoneItem = Form.FormItem;
  return (
    <main className="sales-invite-page">
      <img src="/assets/clinivol-logo-light.png" alt="科立沃" />
      <h1>{done ? "建档资料已提交" : "医生建档"}</h1>
      {done ? (
        <p>资料已提交负责销售完善，正式资质及关联关系由管理员审核。</p>
      ) : (
        <>
          <p>负责销售：{info?.salesName || ""}</p>
          <Form
            labelAlign="top"
            onSubmit={() => {
              if (busy) return;
              setTried(true);
              if (!proof || !name.trim() || !hospital || !department) {
                setError("请完成手机号验证、姓名、医院及科室。");
                return;
              }
              setBusy(true);
              void request(path("public"), {
                assisted,
                proof,
                name,
                phone,
                hospitalId: hospital,
                department,
                title,
                certificate,
                materials,
              })
                .then(() => setDone(true))
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            <PhoneItem label="联系手机号" requiredMark>
              <Input value={phone} disabled={!!proof} onChange={setPhone} />
            </PhoneItem>
            {!proof && (
              <PhoneItem
                label="短信验证码"
                requiredMark
                status={phoneError ? "error" : undefined}
                tips={phoneMessage}
              >
                <div className="sales-actions-inline">
                  <Input value={code} onChange={setCode} />
                  <Button
                    theme="default"
                    variant="outline"
                    onClick={() =>
                      void request(path("public-code"), { phone })
                        .then((r) => {
                          setPhoneMessage(r.message);
                          setPhoneError(false);
                        })
                        .catch((e) => {
                          setPhoneMessage(e.message);
                          setPhoneError(true);
                        })
                    }
                  >
                    获取验证码
                  </Button>
                  <Button
                    theme="primary"
                    onClick={() =>
                      void request(path("public-verify"), { phone, code })
                        .then((r) => {
                          setProof(r.proof);
                          setPhoneMessage("手机号已验证");
                          setPhoneError(false);
                        })
                        .catch((e) => {
                          setPhoneMessage(e.message);
                          setPhoneError(true);
                        })
                    }
                  >
                    验证
                  </Button>
                </div>
              </PhoneItem>
            )}
            {proof && (
              <p>
                手机号已验证
                <Button
                  variant="text"
                  onClick={() => {
                    setProof("");
                    setCode("");
                  }}
                >
                  修改手机号
                </Button>
              </p>
            )}
            <PhoneItem
              label="真实姓名"
              requiredMark
              status={tried && !name.trim() ? "error" : undefined}
              tips={tried && !name.trim() ? "请填写姓名" : undefined}
            >
              <Input value={name} onChange={setName} />
            </PhoneItem>
            <PhoneItem
              label="所属医院"
              requiredMark
              status={tried && !hospital ? "error" : undefined}
              tips={tried && !hospital ? "请选择医院" : undefined}
            >
              <Select
                value={hospital}
                options={
                  info?.hospitals.map((h) => ({
                    value: h.id,
                    label: h.name,
                  })) || []
                }
                onChange={(v) => {
                  setHospital(String(v));
                  setDepartment("");
                }}
              />
            </PhoneItem>
            <PhoneItem
              label="所属科室"
              requiredMark
              status={tried && !department ? "error" : undefined}
              tips={tried && !department ? "请选择科室" : undefined}
            >
              <Select
                value={department}
                options={(
                  info?.hospitals.find((h) => h.id === hospital)?.departments ||
                  []
                ).map((value) => ({ value, label: value }))}
                onChange={(v) => setDepartment(String(v))}
              />
            </PhoneItem>
            <PhoneItem label="职称">
              <Input value={title} onChange={setTitle} />
            </PhoneItem>
            <PhoneItem label="执业证书编号">
              <Input value={certificate} onChange={setCertificate} />
            </PhoneItem>
            {proof && (
              <>
                <PhoneItem label="身份证明照片">
                  <div>
                    <SalesAttachments
                      owner="invitation"
                      value={materials}
                      images
                      category="identity"
                      save={upload}
                      load={load}
                      onChange={setMaterials}
                      onBusyChange={(value) => setUploadBusy("identity", value)}
                    />
                  </div>
                </PhoneItem>
                <PhoneItem label="执业证明照片">
                  <div>
                    <SalesAttachments
                      owner="invitation"
                      value={materials}
                      images
                      category="practice"
                      save={upload}
                      load={load}
                      onChange={setMaterials}
                      onBusyChange={(value) => setUploadBusy("practice", value)}
                    />
                  </div>
                </PhoneItem>
                <PhoneItem label="PDF及其他附件">
                  <div>
                    <SalesAttachments
                      owner="invitation"
                      value={materials}
                      category="other"
                      save={upload}
                      load={load}
                      onChange={setMaterials}
                      onBusyChange={(value) => setUploadBusy("other", value)}
                    />
                  </div>
                </PhoneItem>
              </>
            )}
            {error && (
              <p role="alert" className="sales-error">
                {error}
              </p>
            )}
            <Button
              theme="primary"
              type="submit"
              disabled={!info || busy}
              block
            >
              提交建档资料
            </Button>
          </Form>
        </>
      )}
    </main>
  );
}
