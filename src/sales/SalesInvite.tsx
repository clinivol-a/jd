import {DoctorFields} from './DoctorFields';
import {doctorErrors} from './doctorRules.mjs';
import type {Doctor} from './model';
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
            <p className="sales-invite-description">微信扫码填写医生建档资料。<br/>也可复制链接，通过浏览器填写。</p>
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
    [retryAt,setRetryAt]=useState(0),[clock,setClock]=useState(Date.now()),
    [fieldErrors,setFieldErrors]=useState<Record<string,string>>({}),
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
      phone,
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
  useEffect(()=>{const t=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(t)},[]);
  const remaining=Math.max(0,Math.ceil((retryAt-clock)/1000));
  const d:Doctor={id:'invitation',name,phone,hospitalId:hospital,department,title,certificate,materials,status:'草稿',owner:null,reason:'',source:'邀请建档'};
  const update=(v:Doctor)=>{setName(v.name);if(!proof)setPhone(v.phone);setHospital(v.hospitalId);setDepartment(v.department);setTitle(v.title);setCertificate(v.certificate);setMaterials(v.materials)};
  const PhoneItem = Form.FormItem;
  return (
    <main className="sales-invite-page">
      <header className="sales-invite-brand"><img src={`/assets/clinivol-logo-${document.documentElement.getAttribute("theme-mode")==="dark"?"dark":"light"}.png`} alt="科立沃"/></header>
      <div className="sales-invite-heading"><h1>{done ? "建档资料已提交" : "医生建档"}</h1><p>负责销售：{info?.salesName || ""}</p></div>
      {done ? (
        <p>资料已提交负责销售完善，正式资质及关联关系由管理员审核。</p>
      ) : (
        <>

          <Form
            className="sales-doctor-form"
            labelAlign="top"
            onSubmit={() => {
              if (busy) return;
              setTried(true);
              const errors=doctorErrors(d,true);setFieldErrors(errors);
              if ((!proof&&!assisted)||Object.keys(errors).length) {setError('请检查必填资料及证明材料。');return;}
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
            {!proof&&!assisted ? <section className="sales-invite-verify">
              <PhoneItem label="联系手机号" requiredMark><Input value={phone} onChange={setPhone}/></PhoneItem>
              <PhoneItem label="短信验证码" requiredMark status={phoneError?'error':undefined} tips={phoneMessage}>
                <div className="sales-invite-code"><Input value={code} onChange={setCode}/><Button theme="default" variant="outline" disabled={remaining>0} onClick={()=>void request(path('public-code'),{phone}).then(r=>{setRetryAt(Date.now()+60000);setPhoneMessage(r.message);setPhoneError(false)}).catch(e=>{setPhoneMessage(e.message);setPhoneError(true)})}>{remaining?`${remaining}s 后重试`:'获取验证码'}</Button></div>
              </PhoneItem>
              <Button theme="primary" onClick={()=>void request(path('public-verify'),{phone,code}).then(r=>{setProof(r.proof);setPhoneMessage('手机号已验证');setPhoneError(false)}).catch(e=>{setPhoneMessage(e.message);setPhoneError(true)})}>验证并继续</Button>
            </section>:<DoctorFields d={d} set={update} hospitals={info?.hospitals||[]} owner="invitation" errors={fieldErrors} onBusyChange={setUploadBusy} save={upload} load={load} phoneReadonly={!!proof}/>}
            {error && (
              <p role="alert" className="sales-error">
                {error}
              </p>
            )}
            <Button
              theme="primary"
              type="submit"
              disabled={!info || busy || (!proof&&!assisted)}
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
