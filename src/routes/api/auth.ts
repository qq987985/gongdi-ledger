import { createFileRoute } from "@tanstack/react-router";
import { ensureAccounts, handleAuthPost } from "~/lib/accounts.server";
import { persistOn } from "~/lib/nas-fs.server";

export const Route = createFileRoute("/api/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn())
          return Response.json({ persist: false, needSetup: false, user: null, books: [] });
        const data = await ensureAccounts();
        const { resolveTenant, publicUser, memberList } = await import("~/lib/accounts.server");
        const { hasPerm } = await import("~/lib/perms");
        const t = await resolveTenant(request);
        const manage = Boolean(t.user && (t.user.role === "admin" || t.book?.ownerId === t.user.id || hasPerm(t.perms, "members.manage")));
        return Response.json({
          persist: true,
          needSetup: t.needSetup,
          user: t.user ? publicUser(t.user) : null,
          books: t.books,
          bookId: t.bookId,
          perms: t.perms,
          members: t.book ? memberList(t.book, data.users) : [],
          users: t.user && (t.user.role === "admin" || manage) ? data.users.map(publicUser) : [],
        });
      },
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ error: "未开启 NAS 持久化" }, { status: 400 });
        return handleAuthPost(request);
      },
    },
  },
});
