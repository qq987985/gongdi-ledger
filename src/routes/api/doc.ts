import { createFileRoute } from "@tanstack/react-router";
import { DOC_CN, persistOn } from "~/lib/paths.server";
import { docIdWritable, findDoc, removeDocFile, saveDoc } from "~/lib/assets.server";
import { auditTenantDelete, gateTenant, needDenied, runInTenant, withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance" || v === "contract" || v === "expense" || v === "payout" || v === "insurance") return v;
  return null;
}

/** 文件类型 → 查看权限：与 UI 的入口模块一致，避免权限错配 */
function kindView(kind: string): string {
  if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") return "contracts.view";
  if (kind === "expense" || kind === "payout") return "expenses.view";
  if (kind === "insurance") return "insurance.view";
  return "attendance.view";
}

function kindEdit(kind: string): string {
  if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") return "contracts.edit";
  if (kind === "expense" || kind === "payout") return "expenses.edit";
  if (kind === "insurance") return "insurance.edit";
  return "attendance.edit";
}

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".ofd": "application/ofd",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
};

export const Route = createFileRoute("/api/doc")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return new Response("not found", { status: 404 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!id || !kind) return new Response("bad request", { status: 400 });
        return withTenant(
          request,
          async () => {
            const hit = await findDoc(id, kind);
            if (!hit) return new Response("not found", { status: 404 });
            const mime = MIME[`.${(hit.fileName.split(".").pop() || "").toLowerCase()}`] || "application/octet-stream";
            // 只允许已知图片/PDF 内联；XML 等办公文件交给下载，避免同源活动内容。
            const disposition = mime === "application/pdf" || mime.startsWith("image/") ? "inline" : "attachment";
            return new Response(new Uint8Array(hit.buf), {
              headers: {
                "Content-Type": mime,
                "Content-Disposition": `${disposition}; filename="${encodeURIComponent(hit.fileName.replace(/[\r\n]/g, ""))}"`,
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
              },
            });
          },
          kindView(kind),
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        // A4（1.8.14）：先鉴权（**不读 body**），读完 body 拿到 kind 再判该模块的编辑权限。
        // 原来 `await request.formData()` 在前、withTenant 在后 —— 未登录的人反复发 50MB 上传
        // 就能把内存吃满（CWE-770/400）。权限位（kindEdit(kind)）与 4xx 语义不变。
        const t = await gateTenant(request);
        if (t instanceof Response) return t;
        // 读 body 前先检查大小：合同/报量等文件单文件 50MB
        const len = Number(request.headers.get("content-length") || 0);
        if (len > 50 * 1024 * 1024) return Response.json({ error: "文件太大，最大 50MB" }, { status: 413 });
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "请用 multipart/form-data 上传文件" }, { status: 400 });
        }
        const id = String(form.get("id") || "");
        const kind = kindOf(String(form.get("kind") || ""));
        const file = form.get("file");
        if (!id || !kind || !(file instanceof File)) return Response.json({ ok: false }, { status: 400 });
        if (file.size === 0) return Response.json({ error: "文件为空，请选择有内容的文件" }, { status: 400 });
        // id 去掉非法字符后为空时 saveDoc 会静默不写盘：先拒掉，不能让用户以为传上去了
        if (!docIdWritable(id))
          return Response.json({ error: "记录编号不合法（去掉非法字符后为空），无法保存文件" }, { status: 400 });
        // 文件名过长会在 rename 时 ENAMETOOLONG（500）
        if (Buffer.byteLength(file.name, "utf8") > 180)
          return Response.json({ error: "文件名太长（最多 180 字节），请改短一点再上传" }, { status: 400 });
        if (file.size > 50 * 1024 * 1024) return Response.json({ error: "文件太大，最大 50MB" }, { status: 413 });
        const replace = String(form.get("replace") || "") === "1";
        const denied = await needDenied(request, t, kindEdit(kind));
        if (denied) return denied;
        const buf = Buffer.from(await file.arrayBuffer());
        return runInTenant(t, async () => {
          const saved = await saveDoc(id, kind, buf, file.name, { replace });
          return Response.json({ ok: true, fileName: saved || file.name });
        });
      },
      DELETE: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!id || !kind) return Response.json({ ok: false }, { status: 400 });
        return withTenant(
          request,
          async (t) => {
            await removeDocFile(id, kind);
            // A5（1.8.14）：删除单据影像必须在**服务端**留痕（客户端漏报/失败就查不出来了）
            await auditTenantDelete(t, {
              action: "删除影像",
              module: "影像资料",
              detail: `${DOC_CN[kind] || kind} ${id}（服务端记录）`,
            });
            return Response.json({ ok: true });
          },
          kindEdit(kind),
        );
      },
    },
  },
});
