import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "~/components/shell";
import { useApp } from "~/lib/store";
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
        <ThemeColor />
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

/** 浏览器顶栏/任务栏主题色跟随界面风格 */
function ThemeColor() {
  const uiStyle = useApp((s) => s.uiStyle);
  const colors: Record<string, string> = {
    classic: "#1e56a0",
    v2: "#4f6bf5",
    apple: "#0a84ff",
    movie: "#7c3aed",
  };
  return (
    <meta
      name="theme-color"
      content={uiStyle === "classic" ? colors.classic : colors[uiStyle] || colors.v2}
    />
  );
}
