/**
 * `src/` 的静态 import 图（G2 / 专家评审 A2 用）。
 *
 * 为什么需要它：`开发规范.md` §12 的三条结构红线（禁循环依赖、存储三层 / Excel / shell
 * 三条主线依赖单向）原来**没有任何机械守卫** —— 三道闸全绿的同时，`src/` 里已经躺着 3 个
 * import 环（评审用 SCC 检测出来的）。这里把「读源码抓 import 边」这件事做成一处实现，
 * 守卫测试（`tests/structure-guards.test.ts`）与将来的排查脚本共用。
 *
 * 只认**静态** `import ... from "..."` / `export ... from "..."`：
 *   · 动态 `import("...")` 是**故意的解环手段**（`shell.tsx` 动态引 nas-sync 就是），
 *     它在 ESM 里不构成静态环，把它算进来会把正常写法误报成环；
 *   · 只解析仓内相对路径与 `~/` 别名，node_modules 与 `/api/...` 这类接口路径不参与。
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

export interface ImportEdge {
  from: string;
  to: string;
  /** 只导类型（`import type` / `export type`）—— 编译后不存在这条边，但 §12 禁止循环依赖不区分 */
  typeOnly: boolean;
}

export interface ImportGraph {
  /** 参与扫描的源文件（绝对路径，按字典序） */
  files: string[];
  /** from → 依赖集合（绝对路径） */
  deps: Map<string, Set<string>>;
  /** 每条边的明细（含 typeOnly 标记，便于排除运行期环） */
  edges: ImportEdge[];
}

const SRC_EXT = [".ts", ".tsx", "/index.ts", "/index.tsx"];

/** 递归收集 `src/` 下的源码（跳过构建产物 routeTree.gen.ts） */
export async function sourceFiles(srcDir: string, dir = srcDir): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === "routeTree.gen.ts") continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...(await sourceFiles(srcDir, p)));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out.sort();
}

/** 解析一条 import 说明符到仓内文件；不是仓内相对路径 / 解析不到就返回 null */
export function resolveSpecifier(fromFile: string, spec: string, known: Set<string>): string | null {
  let base: string;
  if (spec.startsWith("~/")) base = resolve(dirname(fromFile), "..", spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = resolve(dirname(fromFile), spec);
  else return null;
  for (const ext of SRC_EXT) if (known.has(base + ext)) return base + ext;
  return null;
}

/**
 * 抓一个文件里的静态 import / export-from 边。
 *
 * 认**多行**写法（`import {` 换行 `} from "./x";` 在这个仓库里到处都是 —— 逐行扫会漏掉它们，
 * 而漏掉正边会让「依赖方向」和「环」两个检查一起假绿；`assets.server.ts` 的 `./paths.server`
 * 就是这么漏掉的）。做法：先去掉注释，再全局找 `from "..."`，然后回看它属于哪条 import / export
 * 语句（用来判 `import type`）。
 */
export function edgesOf(fromFile: string, text: string, known: Set<string>): ImportEdge[] {
  const code = stripComments(text);
  const out: ImportEdge[] = [];
  const re = /from\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const head = statementHead(code, m.index);
    if (head === null) continue;
    const to = resolveSpecifier(fromFile, m[1], known);
    if (!to) continue;
    out.push({ from: fromFile, to, typeOnly: /^(import|export)\s+type\b/.test(head) });
  }
  return out;
}

/**
 * 某个 `from` 属于哪条语句：回看它前面最近的 `import` / `export`。
 * 语句头里出现 `;` `(` `)` 说明那是 `import("...")` 这类动态导入或已结束的语句 —— 不算静态边。
 */
function statementHead(code: string, at: number): string | null {
  const i = Math.max(code.lastIndexOf("import", at), code.lastIndexOf("export", at));
  if (i < 0) return null;
  const head = code.slice(i, at);
  if (/[;()]/.test(head)) return null;
  return head;
}

/** 去掉块注释与行注释（注释里写 `from "./x"` 是常事，不能当成依赖边） */
export function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
    .join("\n");
}

/** 扫出整个 import 图（`includeTypeOnly: false` = 只算运行期值边） */
export async function buildImportGraph(srcDir: string, opts: { includeTypeOnly?: boolean } = {}): Promise<ImportGraph> {
  const includeTypeOnly = opts.includeTypeOnly !== false;
  const root = resolve(srcDir);
  const files = await sourceFiles(root);
  const known = new Set(files);
  const deps = new Map<string, Set<string>>();
  const edges: ImportEdge[] = [];
  for (const f of files) {
    const found = edgesOf(f, await readFile(f, "utf8"), known).filter((e) => includeTypeOnly || !e.typeOnly);
    deps.set(f, new Set(found.map((e) => e.to)));
    edges.push(...found);
  }
  return { files, deps, edges };
}

/**
 * 强连通分量（Tarjan，迭代版）：返回每个大小 > 1 的分量（= 一个循环依赖），
 * 分量内按字典序排序、分量之间按首元素排序，保证结果稳定可断言。
 */
export function cyclesOf(deps: Map<string, Set<string>>): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const out: string[][] = [];
  let counter = 0;
  const edgesFrom = (n: string) => [...(deps.get(n) ?? [])].filter((x) => deps.has(x));
  for (const start of [...deps.keys()]) {
    if (index.has(start)) continue;
    const work: Array<{ node: string; next: number }> = [{ node: start, next: 0 }];
    index.set(start, counter);
    low.set(start, counter);
    counter += 1;
    stack.push(start);
    onStack.add(start);
    while (work.length) {
      const frame = work[work.length - 1];
      const list = edgesFrom(frame.node);
      if (frame.next < list.length) {
        const w = list[frame.next++];
        if (!index.has(w)) {
          index.set(w, counter);
          low.set(w, counter);
          counter += 1;
          stack.push(w);
          onStack.add(w);
          work.push({ node: w, next: 0 });
        } else if (onStack.has(w)) {
          low.set(frame.node, Math.min(low.get(frame.node)!, index.get(w)!));
        }
      } else {
        work.pop();
        const parent = work[work.length - 1];
        if (parent) low.set(parent.node, Math.min(low.get(parent.node)!, low.get(frame.node)!));
        if (low.get(frame.node) === index.get(frame.node)) {
          const comp: string[] = [];
          for (;;) {
            const w = stack.pop()!;
            onStack.delete(w);
            comp.push(w);
            if (w === frame.node) break;
          }
          if (comp.length > 1) out.push(comp.sort());
        }
      }
    }
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

/** 绝对路径 → 仓库相对路径（`src/lib/x.ts`，断言信息与白名单里都用这个形状） */
export function relToRepo(repoRoot: string, absPath: string): string {
  return relative(repoRoot, absPath).split("\\").join("/");
}
