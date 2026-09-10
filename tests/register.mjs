/**
 * 测试用最小解析钩子（零依赖，不需要 vitest/jest）。
 *
 * 为什么需要它：`src/` 里的相对导入按打包器习惯写成扩展名省略（`./utils`），
 * 而 Node 的 ESM 解析要求写全扩展名。这里在解析失败时依次补 `.ts` / `.tsx` / `/index.ts`，
 * 让 `node --test` 能直接跑源码（Node 22.18+ / 23+ 默认支持 TypeScript 类型擦除）。
 *
 * 用法见 package.json 的 `test` 脚本：
 *   node --import ./tests/register.mjs --test tests/
 */
import { registerHooks } from "node:module";

const EXTS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of EXTS) {
        try {
          return nextResolve(specifier + ext, context);
        } catch {
          // 试下一个后缀
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
