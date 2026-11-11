/** Isolated prototype attachments, genuinely persisted as Blobs in IndexedDB. No medical cloud upload. */
import type { Attachment } from "./model";
const database = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("clinivol-sales-attachments", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
export async function saveFile(owner: string, file: File): Promise<Attachment> {
  if (file.size > 20 * 1024 * 1024) throw new Error("单个附件不得超过20MB。");
  if (!/\.(pdf|png|jpe?g|dcm|dicom|nii|gz|zip|txt)$/i.test(file.name))
    throw new Error("不支持此文件格式。");
  const id = crypto.randomUUID(),
    db = await database();
  try {
    await new Promise<void>((ok, no) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, owner + ":" + id);
      tx.oncomplete = () => ok();
      tx.onerror = () => no(tx.error);
    });
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: owner,
      status: "success",
      storage: "browser",
    };
  } finally {
    db.close();
  }
}
export async function getFile(owner: string, a: Attachment): Promise<Blob> {
  if (a.storage === "invitation") {
    const response = await fetch(
      "/api/sales-demo/file?id=" + encodeURIComponent(a.id),
    );
    if (!response.ok) throw Error("文件不可用或无访问权限。");
    return response.blob();
  }
  const db = await database();
  try {
    return await new Promise<Blob>((ok, no) => {
      const r = db
        .transaction("files")
        .objectStore("files")
        .get(owner + ":" + a.id);
      r.onsuccess = () =>
        r.result ? ok(r.result) : no(Error("本浏览器未保存此文件。"));
      r.onerror = () => no(r.error);
    });
  } finally {
    db.close();
  }
}
export async function openFile(owner: string, a: Attachment) {
  const file = await getFile(owner, a);
  const url = URL.createObjectURL(file),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = a.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
