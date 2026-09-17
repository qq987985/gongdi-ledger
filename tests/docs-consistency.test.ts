/**
 * 文档与代码一致性守卫（专家评审 B14，1.8.14）。
 *
 * 背景（Onboarding 实测）：几处「文档说的」和「代码/文件实际的」不一样，而且**没人会发现** ——
 * 文档不会因为代码变了而报错，`pnpm test` 也不会红。所以把这几条口径钉成静态守卫：
 *
 * · B14① `开发规范.md` §10 的用例数停在「315 个用例」（实际 392，六个版本没跟上）；
 * · B14② `AGENTS.md` 说 `docs/使用与部署/` 的版本行还停在 1.2.x（8 份其实都已改成「以 VERSION.txt 为准」，
 *   且与同一文件末尾的「说明文档落后已闭环」自相矛盾）；
 * · B14③ `docs/README.md` 说「每份报告末尾都有『处理状态』」（实测 6 份没有）；
 * · B14④ `AGENTS.md`「API 写入必须经过 withTenant」比代码宽（`auth.ts`/`images.ts`/`update.ts`
 *   是 `resolveTenant` + 自校验，守卫的口径本来就是「二者其一」）。
 *
 * 思路和别的守卫一样：**断言「文档里的说法与事实一致」**，而不是把文档整段抄一遍 ——
 * 事实侧一律现场读文件/数目录，所以文档或代码任何一边变了，这个测试会红。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expectMinHits, expectRegexCatches } from "./min-hits";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFile(join(root, p), "utf8");

/* ── B14① 用例数 ── */

test("B14① 开发规范 §10 的用例数：不许再写死旧数字，且与 AGENTS 记的基线一致", async () => {
  const spec = await read("开发规范.md");
  const agents = await read("AGENTS.md");

  // 旧写法长这样（「目前覆盖：**315 个用例（315 通过 / 0 个 todo）**」）—— 这种「写死一个数」的句子
  // 每轮加测试就会过期一次，历史教训是停了 6 个版本没人发现。
  const STALE_CLAIM = /目前覆盖[^\n]{0,80}?\d{3} 个用例（\d{3} 通过/;
  expectRegexCatches(
    STALE_CLAIM,
    "**目前覆盖：** **315 个用例（315 通过 / 0 个 todo）**——1.8.4 从 291 增到 307；",
    "B14① 旧写法（写死用例数）",
  );
  assert.doesNotMatch(
    spec,
    STALE_CLAIM,
    "开发规范 §10 又出现了「目前覆盖：**N 个用例（N 通过…）」这种写死的说法 —— 它会随每次加测试过期，" +
      "请只留「以 pnpm test 为准」，历史数字放进括号说明。",
  );
  // 必须指回唯一来源
  assert.match(spec, /以 `pnpm test` 输出的/, "§10 必须写明「用例数以 pnpm test 输出的 ℹ tests / ℹ pass 行为准」");

  // 两处文档记的「当前基线」必须一致（一个改了一个没改 = 下一轮又出现口径分叉）。
  // 刻意不写死版本号：发版时把两处一起改成「1.8.14 的基线是 N / 1.8.14 起覆盖 N」即可，守卫继续生效。
  const inSpec = spec.match(/(\d+\.\d+\.\d+) 的基线是 (\d+) 通过 \/ 0 个 todo/);
  const inAgents = agents.match(/(\d+\.\d+\.\d+) 起覆盖 \*\*(\d+) 个用例/);
  assert.ok(inSpec, "开发规范 §10 要写明基线用例数（形如「1.8.13 的基线是 392 通过 / 0 个 todo」）");
  assert.ok(inAgents, "AGENTS.md 要写明「1.8.13 起覆盖 N 个用例」");
  assert.equal(
    inSpec![1],
    inAgents![1],
    `两份文档写的基线版本不一致（开发规范 ${inSpec![1]} vs AGENTS ${inAgents![1]}）—— 发版时要一起改`,
  );
  assert.equal(
    inSpec![2],
    inAgents![2],
    `两份文档记的用例数不一致（开发规范 ${inSpec![2]} vs AGENTS ${inAgents![2]}）—— 改一处就要改另一处`,
  );
});

/* ── B14② 使用与部署说明的版本行 ── */

test("B14② AGENTS 不许再说「docs/使用与部署/ 版本行停在 1.2.x」，且 8 份说明真的都指向 VERSION.txt", async () => {
  const agents = await read("AGENTS.md");
  assert.doesNotMatch(
    agents,
    /版本行还停在 1\.2\.x/,
    "这句已作废（8 份说明的版本行都写成「以 VERSION.txt 第一行为准」），且与同一文件末尾的「说明文档落后已闭环」自相矛盾",
  );

  // 事实侧：docs/使用与部署/ 下每一份说明都必须写明版本号以 VERSION.txt 为准
  const dir = "docs/使用与部署";
  const files = (await readdir(join(root, dir))).filter((f) => !f.startsWith("."));
  expectMinHits(`B14② ${dir}/ 下的说明文件数`, files.length, 8, "现有 8 份（使用/目录/部署/上传说明等）");
  const missing = [] as string[];
  for (const f of files) {
    const text = await read(`${dir}/${f}`);
    if (!text.includes("VERSION.txt")) missing.push(f);
  }
  assert.deepEqual(
    missing,
    [],
    `这些说明没有写「版本号以 VERSION.txt 第一行为准」，版本行迟早又脱节：\n${missing.join("\n")}`,
  );
});

/* ── B14③ 「处理状态」的口径 ── */

test("B14③ docs/README.md 关于「处理状态」的说法必须与实测一致", async () => {
  const readme = await read("docs/README.md");
  assert.doesNotMatch(
    readme,
    /每份报告末尾都有/,
    "实测有 6 份报告没有「处理状态」小节（标题各不同），不能写成「每份都有」——这条口径曾经让新读者以为状态一定在报告里",
  );

  // 事实侧：README 里列出的「没用『处理状态』标题」的那几份，必须真的没有这个标题，而且文件真的存在。
  const seg = readme.slice(readme.indexOf("标题不统一"), readme.indexOf("—— 状态写在"));
  assert.ok(seg.length > 0, "docs/README.md 里应保留「标题不统一」的说明段（本守卫按它解析例外清单）");
  const listed = [...seg.matchAll(/`([^`]+\.md)`/g)].map((m) => m[1]);
  expectMinHits("B14③ README 列出的「无处理状态标题」报告数", listed.length, 3, "现有 6 份");
  const wrong: string[] = [];
  for (const name of listed) {
    const text = await read(`docs/审查与报告/${name}`);
    if (text.includes("处理状态")) wrong.push(`${name}：README 说它没有「处理状态」，实际里面有`);
  }
  assert.deepEqual(wrong, [], `README 的例外清单与事实不符：\n${wrong.join("\n")}`);

  // 段首声明的份数（「下列 6 份」）也要和清单长度一致
  const count = readme.match(/下列 (\d+) 份没有用/);
  assert.ok(count, "docs/README.md 要写明「下列 N 份没有用『处理状态』这个标题」");
  assert.equal(
    Number(count![1]),
    listed.length,
    `README 写「下列 ${count![1]} 份」，实际列了 ${listed.length} 份 —— 补/删报告后要同步这个数`,
  );
});

/* ── B14④ API 写入口径 ── */

test("B14④ AGENTS 的写接口鉴权口径必须与守卫一致（withTenant 或 resolveTenant）", async () => {
  const agents = await read("AGENTS.md");
  assert.doesNotMatch(
    agents,
    /^- API 写入必须经过/m,
    "这句比代码宽：auth/images/update 三个写接口走的是 resolveTenant + 自校验（守卫的口径本就是「二者其一」）",
  );
  assert.match(agents, /resolveTenant/, "口径里必须写明另一种合规写法 resolveTenant(request)");
  assert.match(
    agents,
    /tests\/api-input-guards\.test\.ts/,
    "要指回守卫（tests/api-input-guards.test.ts）作为唯一口径来源，避免下次又各写一套",
  );

  // 事实侧：AGENTS 举的「台账之外」写接口例子，必须真的走 resolveTenant
  const seg = agents.slice(agents.indexOf("现例："), agents.indexOf("现例：") + 200);
  const examples = [...seg.matchAll(/`(src\/routes\/api\/[\w.-]+\.ts)`/g)].map((m) => m[1]);
  expectMinHits("B14④ AGENTS 举的写接口例子数", examples.length, 3, "现有 auth/images/update 三个");
  const bad: string[] = [];
  for (const f of examples) {
    const text = await read(f);
    if (!/resolveTenant\(/.test(text)) bad.push(`${f}: 没有 resolveTenant(`);
  }
  assert.deepEqual(bad, [], `AGENTS 举的例子与实际代码不符（这些文件必须真的用 resolveTenant）：\n${bad.join("\n")}`);
});
