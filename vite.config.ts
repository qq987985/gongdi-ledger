import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  server: { port: 3000 },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    // 仅构建时内联全部依赖：为了让 Docker 镜像不用装 node_modules 就能跑（见 185e8be）。
    // 开发模式不能开——rolldown-vite 7.x 的模块运行器把 CJS 的 react 也内联进来当 ESM 跑，
    // 报 "module is not defined"，dev 整站 500。dev 下保持默认（node_modules 走原生 require）。
    noExternal: command === "build" ? true : [],
  },
}));
