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
    return { id, name: file.name, size: file.size, type: file.type };
  } finally {
    db.close();
  }
}
export async function openFile(owner: string, a: Attachment) {
  const db = await database();
  try {
    const file = await new Promise<Blob>((ok, no) => {
      const r = db
        .transaction("files")
        .objectStore("files")
        .get(owner + ":" + a.id);
      r.onsuccess = () =>
        r.result ? ok(r.result) : no(new Error("本浏览器未保存此文件。"));
      r.onerror = () => no(r.error);
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = a.name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } finally {
    db.close();
  }
}
