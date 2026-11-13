import { orderErrors } from "../src/sales/orderRules.mjs";
import { InviteProof } from "./sales-invite-proof.mjs";
import { randomBytes, randomUUID } from "node:crypto";
import { networkInterfaces } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Development-only invitation bridge. Never installed in a production build.
export function salesDemoPlugin(
  authOrigin = "http://127.0.0.1:5211",
  storageFile = new URL("../.local/sales-invitations.json", import.meta.url),
  options = {},
) {
  const proofService = options.proofService || new InviteProof();
  let server,
    records = { invites: [], leads: [] };
  const file = storageFile;
  const persist = async () => {
    if(options.saveRecords)return options.saveRecords(records);
    await mkdir(new URL(".", file), { recursive: true });
    await writeFile(file, JSON.stringify(records), { mode: 0o600 });
  };
  return {
    name: "clinivol-sales-local-invitations",
    apply: "serve",
    async configureServer(vite) {
      server = vite;
      try {
        records = options.loadRecords ? await options.loadRecords() : JSON.parse(await readFile(file, "utf8"));
      } catch(e) {if(options.loadRecords)throw e;}
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/sales-demo/")) return next();
        const send = (status, value) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(value));
        };
        try {
          const url = new URL(req.url, "http://local"),
            action = url.pathname.slice("/api/sales-demo/".length);
          if (
            req.method === "POST" &&
            req.headers.origin &&
            new URL(req.headers.origin).host !== req.headers.host
          )
            return send(403, { error: "来源不匹配。" });
          let body = {};
          if (req.method === "POST") {
            let text = "";
            for await (const chunk of req) {
              text += chunk;
              if (text.length > 29 * 1024 * 1024) throw new Error("资料过长。");
            }
            body = JSON.parse(text || "{}");
          }
          if (action.startsWith("public")) {
            const invite = records.invites.find(
              (i) => i.token === url.searchParams.get("token"),
            );
            if (!invite) return send(404, { error: "邀请链接不可用。" });
            if (req.method === "GET")
              return send(200, {
                salesName: invite.name,
                code: invite.code,
                hospitals: invite.hospitals,
              });
            if (action === "public-code") {
              const result=proofService.send(invite.token,body.phone);await persist();
              if(options.exposeDemoCode){const code=proofService.inbox([invite.token]).find(c=>c.phone===body.phone)?.code;result.message=`本次演示验证码：${code}（5分钟内有效）`;}
              return send(200,result);
            }
            if (action === "public-verify") {let result;try{result=proofService.verify(invite.token,body.phone,body.code);}finally{await persist();}return send(200,result);}
            let submittedBy = "资料提交人";
            let submissionMode = "invite";
            if (body.assisted) {
              const sessionResponse = options.getSession ? {json:async()=>options.getSession(req)} : await fetch(authOrigin + "/api/auth/session", {headers:{cookie:req.headers.cookie || ""}});
              const session = await sessionResponse.json();
              if (!session.user || session.locked || session.user.role !== "sales" || session.user.id !== invite.owner) return send(403,{error:"请使用负责销售账号协助建档。"});
              submittedBy = session.user.name;
              submissionMode = "sales-assisted";
            }
            const verified = body.assisted&&!body.proof ? {phone:body.phone} : proofService.check(invite.token, body.proof);
            if(!/^1[3-9]\d{9}$/.test(verified.phone||""))throw Error("请输入有效手机号。");
            body.phone = verified.phone;
            if (action === "public-upload") {
              const f = body.file;
              if (
                !f ||
                !/\.(png|jpe?g|pdf|txt)$/i.test(f.name || "") ||
                !f.content ||
                f.content.length > 28 * 1024 * 1024
              )
                throw Error("请选择20MB以内的图片或PDF文件。");
              const content = Buffer.from(f.content, "base64");
              if (content.length > 20 * 1024 * 1024)
                throw Error("文件超过20MB。");
              const id = randomUUID();
              (records.files ||= []).push({
                id,
                owner: invite.owner,
                phone: verified.phone,
                content: content.toString("base64"),
                name: f.name,
                category: ["identity", "practice", "other"].includes(f.category)
                  ? f.category
                  : "other",
                uploadedAt: new Date().toISOString(),
                uploadedBy: String(body.name || "资料提交人"),
                type: {
                  png: "image/png",
                  jpg: "image/jpeg",
                  jpeg: "image/jpeg",
                  pdf: "application/pdf",
                  txt: "text/plain",
                }[f.name.split(".").at(-1).toLowerCase()],
              });
              await persist();
              return send(200, {
                id,
                name: f.name,
                size: content.length,
                type: f.type,
                category: f.category || "other",
                uploadedAt: new Date().toISOString(),
                uploadedBy: submissionMode === "sales-assisted" ? submittedBy : body.name || "资料提交人",
                status: "success",
                storage: "invitation",
              });
            }
            const hospital = invite.hospitals.find(
              (h) => h.id === body.hospitalId,
            );
            if (
              !body.name?.trim() ||
              body.name.length > 60 ||
              !hospital?.departments.includes(body.department)
            )
              throw new Error("请填写姓名并选择医院、科室。");
            if (body.phone && !/^1[3-9]\d{9}$/.test(body.phone))
              throw new Error("手机号格式不正确。");
            const duplicate = records.leads.find(
              (l) => l.phone && l.phone === body.phone,
            );
            if (duplicate && duplicate.owner !== invite.owner)
              throw Error("此手机号已有建档归属，请联系负责销售处理。");
            const materials = (body.materials || []).flatMap((f) => {
              const stored = records.files?.find(
                (x) =>
                  x.id === f.id &&
                  x.owner === invite.owner &&
                  x.phone === verified.phone,
              );
              return stored
                ? [
                    {
                      id: stored.id,
                      name: stored.name,
                      size: Buffer.from(stored.content, "base64").length,
                      type: stored.type,
                      category: stored.category || "other",
                      uploadedAt: stored.uploadedAt,
                      uploadedBy: stored.uploadedBy,
                      status: "success",
                      storage: "invitation",
                    },
                  ]
                : [];
            });
            if (duplicate) {
              Object.assign(duplicate, {
                name: body.name.trim(),
                hospitalId: hospital.id,
                department: body.department,
                title: String(body.title || ""),
                certificate: String(body.certificate || ""),
                materials: [
                  ...(duplicate.materials || []),
                  ...materials.filter(
                    (f) => !duplicate.materials?.some((x) => x.id === f.id),
                  ),
                ],
                at: new Date().toISOString(),
                phoneVerified: !!body.proof,
                submittedBy, submissionMode,
              });
              await persist();
              return send(200, { id: duplicate.id });
            }
            const lead = {
              id: randomUUID(),
              owner: invite.owner,
              name: body.name.trim(),
              phone: verified.phone,
              phoneVerified: !!body.proof,
              submittedBy, submissionMode,
              title: String(body.title || ""),
              certificate: String(body.certificate || ""),
              materials,
              hospitalId: hospital.id,
              department: body.department,
              code: invite.code,
              at: new Date().toISOString(),
            };
            records.leads.push(lead);
            await persist();
            return send(200, { id: lead.id });
          }
          const session = options.getSession ? options.getSession(req) : await (await fetch(authOrigin + "/api/auth/session", {headers:{cookie:req.headers.cookie||""}})).json();
          const user = session.user;
          if (!user || user.role !== "sales" || session.locked)
            return send(403, { error: "请使用已登录销售账号。" });
          if (action === "order-validate" && req.method === "POST") {
            if (body.ownerId !== user.id)
              return send(403, { error: "订单账号不匹配。" });
            const errors = orderErrors(
              body.order || {},
              body.patientName,
              new Date(),
            );
            return send(Object.keys(errors).length ? 422 : 200, { errors });
          }
          if (action === "order-history-request" && req.method === "POST") {
            if (!user.permissions?.includes("order.history.request"))
              return send(403, { error: "无历史访问申请权限。" });
            return send(503, { error: "历史访问申请需接入正式订单授权服务。" });
          }
          if (action === "codes" && req.method === "GET") {
            const remote = req.socket.remoteAddress || "";
            if (!options.allowTestInbox && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote))
              return send(403, { error: "仅本机测试控制台可读取验证码。" });
            return send(200, {
              codes: proofService.inbox(
                records.invites
                  .filter((i) => i.owner === user.id)
                  .map((i) => i.token),
              ),
            });
          }
          if (action === "file" && req.method === "GET") {
            const f = records.files?.find(
              (x) => x.id === url.searchParams.get("id"),
            );
            if (!f || f.owner !== user.id)
              return send(404, { error: "文件不可用或无访问权限。" });
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Content-Type", f.type || "application/octet-stream");
            res.setHeader("Cache-Control", "no-store");
            res.end(Buffer.from(f.content, "base64"));
            return;
          }
          if (action === "invite" && req.method === "POST") {
            let invite = records.invites.find((i) => i.owner === user.id);
            if (!invite) {
              invite = {
                owner: user.id,
                name: user.name,
                code: "CV-SALES-" + user.id.slice(-6).toUpperCase(),
                token: randomBytes(24).toString("hex"),
                hospitals: body.hospitals,
              };
              records.invites.push(invite);
              await persist();
            }
            invite.hospitals = body.hospitals;
            await persist();
            const ip = Object.values(networkInterfaces())
              .flat()
              .find(
                (i) =>
                  i &&
                  i.family === "IPv4" &&
                  !i.internal &&
                  i.address.startsWith("192.168."),
              )?.address;
            const port = server.config.server.port;
            const canUseLAN =
              server.config.server.host === true ||
              ["0.0.0.0", "::"].includes(server.config.server.host);
            const host = canUseLAN && ip ? ip : "127.0.0.1";
            return send(200, {
              code: invite.code,
              url: options.publicOrigin ? `${options.publicOrigin}/sales-invite?token=${invite.token}` : `http://${host}:${port}/sales-invite?token=${invite.token}`,
              lan: !!ip && canUseLAN,
            });
          }
          if (action === "leads" && req.method === "GET")
            return send(200, {
              leads: records.leads.filter((l) => l.owner === user.id),
            });
          send(404, { error: "入口不存在。" });
        } catch (error) {
          send(400, { error: error.message || "邀请服务不可用。" });
        }
      });
    },
  };
}
