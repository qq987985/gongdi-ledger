export const results: { n: number; group: string; title: string; ok: boolean; msg: string }[] = [];

export function check(group: string, title: string, fn: () => void) {
  const n = results.length + 1;
  try {
    fn();
    results.push({ n, group, title, ok: true, msg: "" });
  } catch (e: any) {
    results.push({ n, group, title, ok: false, msg: String(e?.message ?? e) });
  }
}

export function eq(actual: any, expected: any, label = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label} 期望 ${b} 实际 ${a}`);
}
export function okv(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}
export function report() {
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  for (const r of results)
    console.log(`${r.ok ? "PASS" : "FAIL"} #${r.n} [${r.group}] ${r.title}${r.ok ? "" : "  :: " + r.msg}`);
  console.log(`\n=== 往返用例 ${results.length} 个 / 通过 ${pass} / 失败 ${fail} ===`);
  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    console.log("\n--- 失败详情 ---");
    for (const f of fails) console.log(`#${f.n} [${f.group}] ${f.title}\n    ${f.msg}`);
  }
}
