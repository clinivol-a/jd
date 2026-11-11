import { useEffect, useRef, useState } from "react";
import { Upload, Button, Dialog, MessagePlugin, Tooltip } from "tdesign-react";
import { UploadIcon, InfoCircleIcon } from "tdesign-icons-react";
import type { UploadFile } from "tdesign-react";
import type { UploadRef } from "tdesign-react/es/upload/interface";
import type { Attachment } from "./model";
import { saveFile, getFile, openFile } from "./files";
import { formatAuditTime } from "../dateTime";
type Props = {
  owner: string;
  ownerName?: string;
  help?: string;
  helpTooltip?: string;
  value: Attachment[];
  onChange?: (files: Attachment[]) => void;
  readonly?: boolean;
  category?: Attachment["category"];
  images?: boolean;
  accept?: string;
  validate?: (file: File) => string;
  onBusyChange?: (busy: boolean) => void;
  save?: (file: File, category: Attachment["category"]) => Promise<Attachment>;
  load?: (file: Attachment) => Promise<Blob>;
};
export function SalesAttachments({
  owner,
  ownerName,
  help,
  helpTooltip,
  value = [],
  onChange,
  readonly,
  category,
  images,
  accept,
  validate,
  onBusyChange,
  save,
  load,
}: Props) {
  const orderUpload = category === "imaging" || category === "order-other";
  const selected = orderUpload ? value : category
    ? value.filter((f) =>
        images
          ? f.type.startsWith("image/") &&
            (f.category === category ||
              (!f.category && category === "practice"))
          : category === "other"
            ? !f.type.startsWith("image/")
            : f.category === category,
      )
    : value;
  const [files, setFiles] = useState<UploadFile[]>([]),
    [preview, setPreview] = useState("");
  const [previewType, setPreviewType] = useState("image");
  const uploadRef = useRef<UploadRef>(null);
  const [failed, setFailed] = useState(false);
  const uploading = useRef(0);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    void Promise.all(
      selected.map(async (f) => {
        let url = "";
        let readable = true;
        if (images || orderUpload) {
          try {
            const blob = await (load ? load(f) : getFile(owner, f));
            if (active) {
              url = URL.createObjectURL(blob);
              urls.push(url);
            }
          } catch { readable = false; }
        }
        return {
          ...f,
          url,
          status: !orderUpload || (f.status === "success" && readable) ? "success" as const : "fail" as const,
          response: { id: f.id, ...(!readable && orderUpload ? {error:"已保存文件不可读取，请重新上传。"}: {}) },
        };
      }),
    ).then((rows) => {
      if (active) setFiles(rows);
    });
    return () => {
      active = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [value, owner, category, images]);
  const persist = async (input: UploadFile | UploadFile[]) => {
    const f = Array.isArray(input) ? input[0] : input;
    uploading.current++;
    onBusyChange?.(true);
    try {
      const raw = f?.raw;
      if (!raw) throw new Error("无法读取所选文件，请重新选择。");
      const validation = validate?.(raw);
      if (validation) throw new Error(validation);
      const stored = save
        ? await save(raw, category)
        : await saveFile(owner, raw);
      const record = {
        ...stored,
        category:
          !category?.startsWith("order") &&
          category !== "imaging" &&
          raw.type === "application/pdf"
            ? ("practice" as const)
            : category || ("other" as const),
      };
      latest.current = [...latest.current, record];
      onChange?.(latest.current);
      return {
        status: "success" as const,
        response: {
          files: [record],
        },
      };
    } catch (e) {
      const message = (e as Error).message;
      return {
        status: "fail" as const,
        error: message,
        response: { error: message },
      };
    } finally {
      uploading.current--;
      onBusyChange?.(uploading.current > 0);
    }
  };
  const view = async (f: Attachment) => {
    try { if (f.type === "application/pdf" || f.type.startsWith("image/")) {
      const blob=await (load ? load(f) : getFile(owner,f));
      if(preview)URL.revokeObjectURL(preview);
      setPreviewType(f.type==="application/pdf" ? "pdf" : "image");setPreview(URL.createObjectURL(blob));
    } else await openFile(owner,f); } catch(e){void MessagePlugin.error((e as Error).message);}
  };
  return (
    <div className="sales-attachments" onClickCapture={orderUpload ? e=>{
      const anchor=(e.target as Element).closest("a");
      if(!anchor)return;
      const row=files.find(f=>f.url===anchor.getAttribute("href"));
      const record=selected.find(f=>f.id===row?.id);
      if(record){e.preventDefault();e.stopPropagation();void view(record);}
    }:undefined}>
      {!readonly && (
        <Upload
          ref={uploadRef}
          onFail={() => setFailed(true)}
          onSuccess={() => setFailed(false)}
          theme={images ? "image" : orderUpload ? "file-flow" : "file"}
          multiple
          accept={accept || (images ? "image/png,image/jpeg" : undefined)}
          files={files}
          onChange={orderUpload ? next=>{setFiles(next);setFailed(next.some(f=>f.status==="fail"));} : undefined}
          requestMethod={persist}
          useMockProgress={false}
          showUploadProgress
          onRemove={({ file }) => {
            if (!file) return;
            if (orderUpload) {
              const remaining = files.filter(f => file.id ? f.id !== file.id : f.name !== file.name);
              setFiles(remaining);
              setFailed(remaining.some(f => f.status === "fail"));
            }
            if (!file.id) return;
            latest.current = latest.current.filter((f) => f.id !== file.id);
            onChange?.(latest.current);
          }}
        >
          <div><Button theme="default" variant="outline" icon={orderUpload ? <UploadIcon /> : undefined}>
            {images ? "选择照片" : "选择文件"}
          </Button>{help && <p className="sales-upload-help">{help}{helpTooltip && <Tooltip content={helpTooltip}><span aria-label="影像导入说明"><InfoCircleIcon size={16} /></span></Tooltip>}</p>}</div>
        </Upload>
      )}
      {!readonly && orderUpload && failed && (
        <Button
          variant="text"
          theme="primary"
          disabled={uploading.current > 0}
          onClick={() => uploadRef.current?.uploadFiles()}
        >
          重新上传
        </Button>
      )}
      {readonly && selected.length === 0 && <p>暂无附件</p>}
      {(readonly ? selected : []).map((f) => (
        <div className="sales-attachment-record" key={f.id}>
          <Button
            variant="text"
            theme="primary"
            onClick={() =>
              orderUpload ? void view(f) : void openFile(owner, f).catch((e) => MessagePlugin.error(e.message))
            }
          >
            {f.name}
          </Button>
          <span>
            {f.name.split(".").at(-1)?.toUpperCase()} ·{" "}
            {(f.size / 1024).toFixed(1)} KB
          </span>
          <span>
            {(f.uploadedBy === owner ? ownerName : f.uploadedBy) ||
              "未记录上传人"}{" "}
            · {f.uploadedAt ? formatAuditTime(f.uploadedAt) : "未记录上传时间"}
          </span>
          <span>已保存</span>
          {images && (
            <Button
              variant="text"
              onClick={() =>
                void (load ? load(f) : getFile(owner, f))
                  .then((blob) => setPreview(URL.createObjectURL(blob)))
                  .catch((e) => MessagePlugin.error(e.message))
              }
            >
              预览
            </Button>
          )}
        </div>
      ))}
      <Dialog
        visible={!!preview}
        header="资料预览"
        footer={false}
        onClose={() => {
          if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
          setPreview("");
        }}
      >
        {previewType === "pdf" ? <iframe title="订单附件PDF预览" src={preview} className="sales-attachment-pdf" /> : <img alt="附件预览" src={preview} className="sales-attachment-preview" />}
      </Dialog>
    </div>
  );
}
