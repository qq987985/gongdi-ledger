import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { findPhotoPath, isWritablePhotoDataUrl, photoNameWritable, removePhoto, savePhoto } from "~/lib/assets.server";
import { auditTenantDelete, gateTenant, needDenied, runInTenant, withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
  return null;
}

/** 照片类别中文名（与客户端 `src/lib/photos.ts` 的 PHOTO_KIND_LABEL 同口径，审计内容里给用户看） */
const PHOTO_CN: Record<string, string> = { id: "身份证正面", idBack: "身份证反面", bank: "银行卡", ic: "IC卡" };

export const Route = createFileRoute("/api/photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ url: null });
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!name || !kind) return Response.json({ url: null });
        return withTenant(
          request,
          async () => {
            const hit = await findPhotoPath(name, kind);
            if (!hit) return Response.json({ url: null, file: null });
            return Response.json({
              url: `/api/photo-file?name=${encodeURIComponent(name)}&kind=${kind}&v=${encodeURIComponent(hit.file)}`,
              file: hit.file,
            });
          },
          "people.view",
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        // A4（1.8.14）：先鉴权（**不读 body**），读完 body 拿到 kind 再判具体权限。
        // 原来 `await request.json()` 在前、withTenant 在后 —— 未登录的人反复发 20MB body
        // 就能把内存吃满（CWE-770/400）。权限位（photos.edit）与 4xx 语义不变。
        const t = await gateTenant(request);
        if (t instanceof Response) return t;
        // 照片走 base64 JSON，限制 20MB（原图过大先压缩再传）
        const len = Number(request.headers.get("content-length") || 0);
        if (len > 20 * 1024 * 1024) return Response.json({ error: "照片太大，最大 20MB" }, { status: 413 });
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
        }
        const kind = kindOf(body.kind || null);
        if (!body.name || !kind || !body.dataUrl) return Response.json({ ok: false }, { status: 400 });
        // 名字过长会在写盘时 ENAMETOOLONG（500）——先友好拒掉
        if (Buffer.byteLength(String(body.name), "utf8") > 120)
          return Response.json({ error: "文件名太长（最多 120 字节），请改短一点" }, { status: 400 });
        if (body.dataUrl.length > 20 * 1024 * 1024) return Response.json({ error: "照片太大，最大 20MB" }, { status: 413 });
        // 下面两种入参 savePhoto 会静默不写盘：必须在写之前拒掉，
        // 否则接口回 200 {ok:true}、用户以为传上去了，实际什么都没有（静默失败）
        if (!photoNameWritable(body.name))
          return Response.json({ error: "文件名去掉非法字符后为空，请换一个名字" }, { status: 400 });
        if (!isWritablePhotoDataUrl(body.dataUrl))
          return Response.json({ error: "照片数据格式不对（需要 data:image/…;base64,… 的图片数据）" }, { status: 400 });
        const denied = await needDenied(request, t, "photos.edit");
        if (denied) return denied;
        return runInTenant(t, async () => {
          await savePhoto(body.name, kind, body.dataUrl);
          return Response.json({ ok: true });
        });
      },
      DELETE: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!name || !kind) return Response.json({ ok: false }, { status: 400 });
        // 名字全是非法字符时 removePhoto 会静默跳过：回 200 会让用户以为删掉了
        if (!photoNameWritable(name))
          return Response.json({ error: "文件名去掉非法字符后为空，没有可删除的照片" }, { status: 400 });
        return withTenant(
          request,
          async (t) => {
            await removePhoto(name, kind);
            // A5（1.8.14）：删除影像必须在**服务端**留痕。原来只有客户端 logOp，
            // 会话过期/网络失败/前端漏报就彻底查不出「谁把证件照删了」。
            await auditTenantDelete(t, {
              action: "删除照片",
              module: "照片",
              detail: `${name} ${PHOTO_CN[kind] || kind}（服务端记录）`,
            });
            return Response.json({ ok: true });
          },
          "photos.edit",
        );
      },
    },
  },
});
