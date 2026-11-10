import { randomBytes, randomUUID } from "node:crypto";
import { networkInterfaces } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Development-only invitation bridge. Never installed in a production build.
export function salesDemoPlugin(
  authOrigin = "http://127.0.0.1:5211",
  storageFile = new URL("../.local/sales-invitations.json", import.meta.url),
) {
  let server,
    records = { invites: [], leads: [] };
  const file = storageFile;
  const persist = async () => {
    await mkdir(new URL(".", file), { recursive: true });
    await writeFile(file, JSON.stringify(records), { mode: 0o600 });
  };
  return {
    name: "clinivol-sales-local-invitations",
    apply: "serve",
    async configureServer(vite) {
      server = vite;
      try {
        records = JSON.parse(await readFile(file, "utf8"));
      } catch {}
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
              if (text.length > 8192) throw new Error("资料过长。");
            }
            body = JSON.parse(text || "{}");
          }
          if (action === "public") {
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
              (l) =>
                l.owner === invite.owner && l.phone && l.phone === body.phone,
            );
            if (duplicate) return send(200, { id: duplicate.id });
            const lead = {
              id: randomUUID(),
              owner: invite.owner,
              name: body.name.trim(),
              phone: body.phone || "",
              hospitalId: hospital.id,
              department: body.department,
              code: invite.code,
              at: new Date().toISOString(),
            };
            records.leads.push(lead);
            await persist();
            return send(200, { id: lead.id });
          }
          const response = await fetch(authOrigin + "/api/auth/session", {
              headers: { cookie: req.headers.cookie || "" },
            }),
            session = await response.json();
          const user = session.user;
          if (!user || user.role !== "sales" || session.locked)
            return send(403, { error: "请使用已登录销售账号。" });
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
              url: `http://${host}:${port}/sales-invite?token=${invite.token}`,
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
