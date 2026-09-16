import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { findPhotoPath, isWritablePhotoDataUrl, photoNameWritable, removePhoto, savePhoto } from "~/lib/assets.server";
import { withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
  return null;
}

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
        return withTenant(
          request,
          async () => {
            await savePhoto(body.name, kind, body.dataUrl);
            return Response.json({ ok: true });
          },
          "photos.edit",
        );
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
          async () => {
            await removePhoto(name, kind);
            return Response.json({ ok: true });
          },
          "photos.edit",
        );
      },
    },
  },
});
