import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  normalizeVersion,
  formatVersion,
  formatReleaseDate,
  isNewerVersion,
  parseChangelog,
} from "../src/lib/changelog";

test("normalizeVersion：剥 v 前缀/日期尾巴/方括号，纯数字按老格式展开", () => {
  assert.equal(normalizeVersion("v1.7.9"), "1.7.9");
  assert.equal(normalizeVersion("1.7.9 2026-09-14"), "1.7.9");
  assert.equal(normalizeVersion("[1.7.9]"), "[1.7.9]", "方括号不归 normalizeVersion 剥（归 parseChangelog 的 VER 正则）");
  assert.equal(normalizeVersion("10"), "0.0.10");
  assert.equal(normalizeVersion("7"), "7.0.0");
  assert.equal(normalizeVersion(""), "0.0.0");
  assert.equal(normalizeVersion("1.2.3.4"), "1.2.3.4");
});

test("formatVersion：只有「0.0.x 且 x≥10」才缩写回纯数字", () => {
  assert.equal(formatVersion("0.0.19"), "19");
  assert.equal(formatVersion("0.0.9"), "0.0.9");
  assert.equal(formatVersion("1.7.19"), "1.7.19");
});

test("formatReleaseDate：统一成 YYYY-MM-DD，非法返回空", () => {
  assert.equal(formatReleaseDate("2026-9-4"), "2026-09-04");
  assert.equal(formatReleaseDate("2026/09/04"), "2026-09-04");
  assert.equal(formatReleaseDate("发布于 2026.9.4 更新"), "2026-09-04");
  assert.equal(formatReleaseDate("没有日期"), "");
});

test("isNewerVersion：逐位比较，相等不算新", () => {
  assert.equal(isNewerVersion("1.7.19", "1.7.18"), true);
  assert.equal(isNewerVersion("1.7.19", "1.7.19"), false);
  assert.equal(isNewerVersion("1.8.0", "1.7.19"), true);
  assert.equal(isNewerVersion("1.7.9", "1.7.19"), false);
  assert.equal(isNewerVersion("19", "18"), true, "0.0.19 与 0.0.18 相比");
  assert.equal(isNewerVersion("19", "1.7.18"), false, "0.0.19 比 1.7.18 老");
});

const SAMPLE = `1.7.19

[1.7.19] 2026-09-14
- 结构重构第二轮
- UI 层拆分

[1.7.18] 2026-09-14
- 数据层重构

[1.7.17] 2026-09-13
- 整体复查修掉 8 项
`;

test("parseChangelog：首行裸版本号是 current，括号节进 entries，条目合并去重", () => {
  const c = parseChangelog(SAMPLE);
  assert.equal(c.current, "1.7.19");
  assert.equal(c.entries.length, 3);
  assert.equal(c.entries[0].version, "1.7.19");
  assert.equal(c.entries[0].date, "2026-09-14");
  assert.deepEqual(c.entries[0].items, ["结构重构第二轮", "UI 层拆分"]);
  assert.equal(c.entries[2].version, "1.7.17");
});

test("parseChangelog：真实 VERSION.txt 能解析，current 与首行一致、每节都有内容", async () => {
  const text = await readFile(fileURLToPath(new URL("../VERSION.txt", import.meta.url)), "utf8");
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || "";
  const c = parseChangelog(text);
  assert.equal(c.current, firstLine.trim(), "解析出的 current 必须等于文件首行版本号");
  assert.ok(c.entries.length >= 20, `历史版本节应有 20+（实际 ${c.entries.length}）`);
  for (const e of c.entries) {
    assert.ok(e.items.length >= 1, `${e.version} 节没有条目`);
    assert.match(e.version, /^\d+\.\d+\.\d+$/);
  }
  // 相邻版本号应单调不增（最新在上）
  for (let i = 1; i < c.entries.length; i++) {
    const prev = c.entries[i - 1].version.split(".").map(Number);
    const cur = c.entries[i].version.split(".").map(Number);
    const newerOrEqual =
      prev[0] > cur[0] ||
      (prev[0] === cur[0] && (prev[1] > cur[1] || (prev[1] === cur[1] && prev[2] >= cur[2])));
    assert.ok(newerOrEqual, `版本顺序错乱：${c.entries[i - 1].version} 在 ${c.entries[i].version} 之上`);
  }
});

test("版本号规则守卫：当前版本必须满足 Y≤9、Z≤19（开发规范 §1；1.6.20/1.7.20 两次误发教训）", async () => {
  // 只拦「当前版本」（首行 + 最新一节）：历史里的误发条目（1.2.25/1.6.20/1.7.20）保留作记录，
  // 但下一次发版把首行写成 1.x.20 时，这条测试会直接失败——不再靠人记。
  const text = await readFile(fileURLToPath(new URL("../VERSION.txt", import.meta.url)), "utf8");
  const firstLine = (text.split(/\r?\n/).find((l) => l.trim()) || "").trim();
  const m = firstLine.match(/^(\d+)\.(\d+)\.(\d+)$/);
  assert.ok(m, `VERSION.txt 首行不是 X.Y.Z：${firstLine}`);
  assert.ok(Number(m[2]) <= 9, `第二位 Y=${m[2]} 超过上界 9：到 9 要进位为 X+1.0.0`);
  assert.ok(Number(m[3]) <= 19, `第三位 Z=${m[3]} 超过上界 19：到 19 要进位为 Y+1.0（绝不是 Z=20）`);
  const c = parseChangelog(text);
  assert.equal(c.entries[0]?.version, firstLine, "最新一节版本号必须与首行一致");
});
