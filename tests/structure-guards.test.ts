/**
 * 结构红线守卫（G2 / 专家评审 A2）。
 *
 * 背景：`开发规范.md` §12 的三条红线（禁循环依赖、存储三层 / Excel / shell 三条主线依赖单向、
 * 类型定义在 `types.ts`）原来**全靠人记** —— 实测「3 个 import 环同时存在」的时候
 * `pnpm run typecheck` 0 错、`pnpm test` 392/392 全绿。评审一句话总结：
 * 「规矩写进了文档但没人机械检查」。这个文件就是那道机械检查。
 *
 * 做三件事：
 *  ① 扫 `src/` 的静态 import 图，**禁止新的循环依赖**。白名单只有 §12.3 允许的一条例外
 *     （`update/docker ↔ update/log`），而且要求：白名单每条都写明原因 + 那两个文件的注释里
 *     真的有这段说明（否则「例外」会被当成惯例慢慢扩散）；
 *  ② 断言三条主线的方向仍单向：`paths.server ← assets.server ← nas-fs.server`、
 *     `excel/common ← 实体 ← full`、`lib ← routes/components`；
 *  ③ 把「类型定义只能在叶子模块」变成可断言的事实（`types.ts` 不许 import 任何东西、
 *     `contracts.ts` 不许再自己定义合同三型）—— 这正是 `types ↔ contracts ↔ wage` 那个环的根因。
 *
 * 只读源码（不 import 被检查的模块、不连网），跑得飞快；`tests/import-graph.ts` 是唯一实现。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildImportGraph, cyclesOf, edgesOf, relToRepo } from "./import-graph";
import { expectMinHits, expectRegexCatches } from "./min-hits";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(repoRoot, "src");
const rel = (p: string) => relToRepo(repoRoot, p);

/** 扫描入口：一次扫完给所有用例共用（每个用例各扫一遍没必要，128 个文件约 30ms） */
let graphPromise: ReturnType<typeof buildImportGraph> | null = null;
function graph() {
  graphPromise ??= buildImportGraph(srcDir);
  return graphPromise;
}
async function depsOf(file: string): Promise<string[]> {
  const g = await graph();
  const abs = resolve(repoRoot, file);
  return [...(g.deps.get(abs) ?? [])].map(rel).sort();
}

/** 当前文件清单：用来给「层存在」这类断言一个下限（文件被搬家时守卫不能静默失效） */
async function srcFiles(): Promise<string[]> {
  const g = await graph();
  return g.files.map(rel);
}

/**
 * §12.3 允许的例外，**每条都必须写明「为什么允许」**。
 * `mustMention` 是「代码注释里必须出现的字样」——例外写进代码而不只是写在这里，
 * 下一个人才知道这段互引是被批准的、凭什么被批准。
 */
const ALLOWED_CYCLES: { files: string[]; why: string; mustMention: string[] }[] = [
  {
    files: ["src/lib/update/docker.ts", "src/lib/update/log.ts"],
    why:
      "「一键更新」内部的一对小工具：docker 要 appendUpdateLog 记更新结果，log 要 dockerReq 读更新容器日志。" +
      "再拆一层只让 Docker 请求的签名在三个文件之间转手、真实耦合一点没少（见 §12.3「互通例外要在注释里写明原因」）。",
    mustMention: ["互引例外", "§12.3", "为什么允许"],
  },
];

test("守卫自检：扫描器与环检测器不是摆设（多行 import / 注释 / 动态 import 三个对照）", async () => {
  // 注意：真实扫描里 fromFile 是绝对路径（`sourceFiles` 从绝对 src 目录走），
  // 所以自检也用绝对路径 —— 相对路径会解析不到 `known`，让自检本身假绿。
  // 路径用变量拼（不写字面量）：`tests/guards-paths.test.ts` 会把源码里像
  // `src/lib/xxx.ts` 的字面量当成「守卫引用的真实路径」去查存在性，而这里是合成样本。
  const f = (n: string) => resolve(repoRoot, "src", "lib", n);
  const known = new Set([f("a.ts"), f("b.ts"), f("c.ts")]);
  const B = rel(f("b.ts"));
  const C = rel(f("c.ts"));
  // ① 多行 import 必须抓到（这正是 `assets.server.ts` 那几条被逐行扫漏的写法）
  const multi = edgesOf(f("a.ts"), 'import {\n  x,\n} from "./b";\n', known);
  assert.deepEqual(
    multi.map((e) => [rel(e.to), e.typeOnly]),
    [[B, false]],
    "多行 import 必须算一条依赖边（漏了它，方向检查与环检查都会假绿）",
  );
  // ② 注释里写的 from 不算边
  assert.deepEqual(edgesOf(f("a.ts"), '// 见 from "./c" 的说明\n', known), [], "注释里的 from 不是依赖");
  assert.deepEqual(edgesOf(f("a.ts"), '/** 依赖 from "./c" */\n', known), [], "块注释里的 from 不是依赖");
  // ③ 动态 import 不算静态边（`shell.tsx` 动态引 nas-sync 是有意为之）
  assert.deepEqual(edgesOf(f("a.ts"), 'const m = await import("./c");\n', known), [], "动态 import 不算静态依赖");
  // ④ `import type` 要标出来（消环时用它区分运行期值与纯类型边）；
  //    单行边也要抓得到（上面只证明了多行写法）
  const single = edgesOf(f("a.ts"), 'import type { T } from "./b";\nimport { u } from "./c";\n', known);
  assert.deepEqual(
    single.map((e) => [rel(e.to), e.typeOnly]),
    [[B, true], [C, false]],
    "单行 import / import type 都必须抓得到，且 type 要标出来",
  );

  // ⑤ 环检测器：合成一个环必须报、无环图必须不报
  assert.deepEqual(
    cyclesOf(
      new Map([
        ["a", new Set(["b"])],
        ["b", new Set(["a"])],
        ["c", new Set(["a"])],
      ]),
    ),
    [["a", "b"]],
    "合成环必须被识别（否则「没有环」这个结论没有意义）",
  );
  assert.deepEqual(cyclesOf(new Map([["a", new Set(["b"])], ["b", new Set()]])), [], "无环图不许误报");
});

test("§12：src/ 不许出现白名单之外的循环依赖（含类型环）", async () => {
  const g = await graph();
  const cycles = cyclesOf(g.deps).map((c) => c.map(rel));
  expectMinHits(
    "import 边",
    g.edges.length,
    200,
    "src/ 下现有 128 个源文件（拆文件/搬家时要重新核对这个下限）",
  );
  expectMinHits("被扫描的源文件", g.files.length, 100, "src/ 下现有 128 个源文件");

  const unexpected = cycles.filter((c) => !ALLOWED_CYCLES.some((a) => a.files.length === c.length && a.files.every((f) => c.includes(f))));
  assert.deepEqual(
    unexpected.map((c) => c.join(" <-> ")),
    [],
    `出现了 §12 禁止的循环依赖（白名单只有 ${ALLOWED_CYCLES.flatMap((a) => a.files).join(" / ")}）。\n` +
      "消法：把两边共同依赖的东西**下沉到第三个模块**（通常是叶子 `src/lib/types.ts`），不要用动态 import 绕（那只是把环藏起来）。",
  );

  // 白名单本身要「有据可查」：原因说明非空、且两个文件的注释里真的有这段说明
  for (const a of ALLOWED_CYCLES) {
    assert.ok(a.why.trim().length > 30, `白名单条目 ${a.files.join(" / ")} 必须写明「为什么允许」（现在太短）`);
    for (const f of a.files) {
      const text = await readFile(resolve(repoRoot, f), "utf8");
      for (const hint of a.mustMention)
        assert.ok(
          text.includes(hint),
          `${f} 的注释里缺「${hint}」——§12.3 要求例外必须写明原因，光登记在测试白名单里不够`,
        );
    }
  }
});

test("§12：消环不能靠动态 import —— 静态图之外，环仍要真的不存在", async () => {
  // 只算**运行期值边**时，环里只该剩 update 那一对（类型环不能拿「反正编译后没有」当借口：
  // §12 禁的是依赖关系本身，type 环同样让「改一处坏三处」找不着北，评审 A2 就是这么发现的）。
  const valueGraph = await buildImportGraph(srcDir, { includeTypeOnly: false });
  const cycles = cyclesOf(valueGraph.deps).map((c) => c.map(rel));
  assert.deepEqual(
    cycles.map((c) => c.join(" <-> ")),
    [["src/lib/update/docker.ts", "src/lib/update/log.ts"].map((x) => x).join(" <-> ")],
    "运行期值环只允许 update/docker ↔ update/log 这一条例外",
  );
});

test("§12：存储三层依赖单向 paths.server ← assets.server ← nas-fs.server", async () => {
  const paths = "src/lib/paths.server.ts";
  const assets = "src/lib/assets.server.ts";
  const nfs = "src/lib/nas-fs.server.ts";
  const files = await srcFiles();
  for (const f of [paths, assets, nfs]) assert.ok(files.includes(f), `存储三层文件必须在（${f}）`);

  const pathsDeps = await depsOf(paths);
  assert.deepEqual(
    pathsDeps.filter((d) => d === assets || d === nfs),
    [],
    "paths.server 是三层的最内层：不许反向依赖影像层 / 台账存储",
  );
  assert.deepEqual(
    (await depsOf(assets)).filter((d) => d === nfs),
    [],
    "§12.2：影像层不许 import 台账存储（要台账内容时由调用方传入，类型走叶子 types.ts）",
  );
  // 允许的方向必须真的存在，否则「三层」只是文档里的说法
  assert.ok((await depsOf(assets)).includes(paths), "assets.server 应当依赖 paths.server（路径与目录初始化）");
  assert.ok((await depsOf(nfs)).includes(paths), "nas-fs.server 应当依赖 paths.server（路径与目录初始化）");
  assert.ok((await depsOf(nfs)).includes(assets), "nas-fs.server 读取台账时要影像层的 reconcileContractScans（方向允许）");
});

test("§12：Excel 主线依赖单向 excel/common ← 实体模块 ← full", async () => {
  const entities = ["attendance", "contracts", "expenses", "insurance", "payments", "people"].map((n) => `src/lib/excel/${n}.ts`);
  const common = "src/lib/excel/common.ts";
  const full = "src/lib/excel/full.ts";
  const files = await srcFiles();
  for (const f of [common, full, ...entities]) assert.ok(files.includes(f), `excel 模块必须在（${f}）`);

  const inExcel = (d: string) => d.startsWith("src/lib/excel/") && d.endsWith(".ts");
  assert.deepEqual(
    (await depsOf(common)).filter(inExcel),
    [],
    "excel/common.ts 是所有实体模块共用的叶子：不许反向 import 实体模块或 full（会造环）",
  );
  const backwards = [];
  for (const e of entities) if ((await depsOf(e)).includes(full)) backwards.push(e);
  assert.deepEqual(backwards, [], "实体模块不许反向依赖 excel/full（full 才是汇总那层）");
  const notUsingCommon = [];
  for (const e of entities) if (!(await depsOf(e)).includes(common)) notUsingCommon.push(e);
  assert.deepEqual(notUsingCommon, [], "六个实体模块都应复用 excel/common 的列名与解析（不许各写一套）");
});

test("§12：UI 依赖单向 lib ← components / routes（lib 里不许 import 组件或路由）", async () => {
  const g = await graph();
  const bad: string[] = [];
  let libFiles = 0;
  for (const [abs, deps] of g.deps) {
    const from = rel(abs);
    if (!from.startsWith("src/lib/")) continue;
    libFiles += 1;
    for (const d of deps) {
      const to = rel(d);
      if (to.startsWith("src/components/") || to.startsWith("src/routes/"))
        bad.push(`${from} -> ${to}`);
    }
  }
  expectMinHits("src/lib 下的文件", libFiles, 40, "src/lib 现有 50 余个文件");
  assert.deepEqual(bad, [], `领域/工具层不许依赖 UI 层（反了会让 lib 无法在服务端与测试里复用）：\n${bad.join("\n")}`);
});

test("§3：「类型定义唯一来源是 types.ts」—— 它必须是叶子，合同三型不许再回头定义", async () => {
  const types = "src/lib/types.ts";
  assert.deepEqual(
    await depsOf(types),
    [],
    "types.ts 是类型叶子（G2：types ↔ contracts ↔ wage 那个环的根因就是它反向 import 了 contracts）",
  );
  const text = await readFile(resolve(repoRoot, types), "utf8");
  for (const name of ["ContractRecord", "EntryKind", "ContractEntry", "LedgerRead"]) {
    assert.match(text, new RegExp(`export (interface|type) ${name}\\b`), `${name} 的定义应当在 types.ts（唯一模型来源）`);
  }
  const contracts = await readFile(resolve(repoRoot, "src/lib/contracts.ts"), "utf8");
  // 反向再导出是允许的（调用点不用改），但**不许**再自己定义一遍 —— 那样环会悄悄回来
  assert.match(contracts, /export type \{ ContractEntry, ContractRecord, EntryKind \} from "\.\/types";/, "contracts.ts 要再导出这三个类型（保证旧调用点不断）");
  const badSample = 'export interface ContractRecord {\n  id: string;\n}';
  const re = /export (interface|type) (ContractRecord|EntryKind|ContractEntry)\b/;
  expectRegexCatches(re, badSample, "「contracts.ts 不许自己定义合同三型」这条正则");
  assert.doesNotMatch(
    contracts,
    re,
    "contracts.ts 不许再定义 ContractRecord / EntryKind / ContractEntry（定义在 types.ts；否则循环依赖会原路返回）",
  );
  // wage.ts 是值依赖 contracts 的反方向：它只许从 types 拿类型
  const wage = await readFile(resolve(repoRoot, "src/lib/wage.ts"), "utf8");
  assert.doesNotMatch(wage, /from "\.\/contracts"/, "wage.ts 不许 import contracts.ts（types 才是共同依赖的叶子）");
});
