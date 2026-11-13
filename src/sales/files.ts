/** Isolated prototype attachments, genuinely persisted as Blobs in IndexedDB. No medical cloud upload. */
import { fixtureBytes } from "./orderFixtures.mjs";
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
  return persistFile(owner, file);
}
export async function saveClinicalMedia(owner:string, file:File):Promise<Attachment> {
  if(!owner) throw Error("请使用已登录账号保存媒体。");
  if (!file.size || file.size > 20*1024*1024) throw Error("请选择20MB以内的非空图片或MP4视频。");
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
  const valid=(file.type==='image/png' && /\.png$/i.test(file.name) && bytes[0]===137 && ascii(1,4)==='PNG') ||
    (file.type==='image/jpeg' && /\.jpe?g$/i.test(file.name) && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) ||
    (file.type==='image/webp' && /\.webp$/i.test(file.name) && ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP') ||
    (file.type==='video/mp4' && /\.mp4$/i.test(file.name) && ascii(4,8)==='ftyp');
  if (!valid) throw Error("文件内容与支持的PNG、JPG、WEBP或MP4格式不符。");
  return persistFile(owner,file);
}
async function persistFile(owner:string, file:File):Promise<Attachment> {
  const id = crypto.randomUUID(),
    db = await database();
  try {
    await new Promise<void>((ok, no) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, owner + ":" + id);
      tx.oncomplete = () => ok();
      tx.onerror = () => no(tx.error);
      tx.onabort = () => no(tx.error || Error("文件保存已中断，请重试。"));
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
  if (a.storage === "demo-fixture") {
    if (a.uploadedBy !== owner) throw Error("文件不可用或无访问权限。");
    const kind = a.type === "application/pdf" ? 1 : a.type.startsWith("image/") ? 2 : 0;
    return new Blob([fixtureBytes(kind) as Uint8Array<ArrayBuffer>], {type:a.type});
  }
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
