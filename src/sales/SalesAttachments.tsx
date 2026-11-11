import { useEffect, useRef, useState } from "react";
import { Upload, Button, Dialog, MessagePlugin } from "tdesign-react";
import type { UploadFile } from "tdesign-react";
import type { Attachment } from "./model";
import { saveFile, getFile, openFile } from "./files";
import { formatAuditTime } from "../dateTime";
type Props = {
  owner: string;
  ownerName?: string;
  value: Attachment[];
  onChange?: (files: Attachment[]) => void;
  readonly?: boolean;
  category?: Attachment["category"];
  images?: boolean;
  onBusyChange?: (busy: boolean) => void;
  save?: (file: File, category: Attachment["category"]) => Promise<Attachment>;
  load?: (file: Attachment) => Promise<Blob>;
};
export function SalesAttachments({
  owner,
  ownerName,
  value = [],
  onChange,
  readonly,
  category,
  images,
  onBusyChange,
  save,
  load,
}: Props) {
  const selected = category
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
  const uploading = useRef(0);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    void Promise.all(
      selected.map(async (f) => {
        let url = "";
        if (images) {
          try {
            const blob = await (load ? load(f) : getFile(owner, f));
            if (active) {
              url = URL.createObjectURL(blob);
              urls.push(url);
            }
          } catch {}
        }
        return {
          ...f,
          url,
          status: "success" as const,
          response: { id: f.id },
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
      const stored = save
        ? await save(raw, category)
        : await saveFile(owner, raw);
      const record = {
        ...stored,
        category:
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
  return (
    <div className="sales-attachments">
      {!readonly && (
        <Upload
          theme={images ? "image" : "file"}
          multiple
          accept={images ? "image/png,image/jpeg" : undefined}
          files={files}
          requestMethod={persist}
          showUploadProgress
          onRemove={({ file }) => {
            if (!file?.id) return;
            latest.current = latest.current.filter((f) => f.id !== file.id);
            onChange?.(latest.current);
          }}
        >
          <Button theme="default" variant="outline">
            {images ? "选择照片" : "选择文件"}
          </Button>
        </Upload>
      )}
      {readonly && selected.length === 0 && <p>暂无附件</p>}
      {(readonly ? selected : []).map((f) => (
        <div className="sales-attachment-record" key={f.id}>
          <Button
            variant="text"
            theme="primary"
            onClick={() =>
              void openFile(owner, f).catch((e) =>
                MessagePlugin.error(e.message),
              )
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
        <img
          alt="证明资料"
          src={preview}
          style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain" }}
        />
      </Dialog>
    </div>
  );
}
