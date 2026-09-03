import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "~/components/shell";
import { Toaster } from "sonner";
import "~/styles.css";

const APP_NAME = "台账";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover",
      },
      { title: APP_NAME },
      {
        name: "theme-color",
        content: "#1e56a0",
      },
      {
        name: "description",
        content: "人员考勤、工资发放与合同台账",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-title",
        content: APP_NAME,
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  }),
  component: () => (
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <noscript>
          <p style={{ padding: 16, textAlign: "center" }}>本系统需要浏览器允许脚本。请关闭拦截后刷新。</p>
        </noscript>
        <AppShell />
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  ),
});
