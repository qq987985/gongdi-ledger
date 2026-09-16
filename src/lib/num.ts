/**
 * 外部输入的容错数值解析（全库唯一实现）。
 *
 * 1.7.13 起这段逻辑长在 `excel/common.ts` 的 `parseNumber` 里，只服务 Excel 导入。
 * 但「把读不出来的东西当成 0」并不只发生在 Excel：表单里的 `Number(x) || 0`、
 * 旧版 localStorage 数据的 `Number(x) || 0`、URL 参数，都是同一个病 ——
 * `Number("1,200")` 是 NaN，于是「1,200」被静默写成 0，钱的数字最怕这个。
 * 所以把它提到这里，并拆成两件事：
 *
 * - `parseNum(v)`：只负责「读得出来就读出来」，读不出来返回 `null` —— 失败是可知的；
 * - `numOr(v, d)`：读不出来返回兜底值（调用方自己选，通常是 0）；
 * - `numOrWarn(v, d, what)`：同上，但「明明填了东西却读不出数」时 `console.warn` 留痕。
 * - `parseNumber(v)`：1.7.13 起的旧名字，等价于 `numOr(v, 0)`，行为完全不变，
 *   由 `excel/common.ts` re-export，既有的 `from "./common"` / `from "~/lib/excel"` 都不用改。
 *
 * 容忍：number 直通、千分位逗号、`¥￥$`、全角数字/逗号/括号、首尾空格、
 * 常见单位后缀（元/天/个/次/人/月/年/日/项/台/套/小时/时/%）、括号负数 `(1,200)` → -1200。
 */

/** 解析外部输入；**读不出来返回 null**（空值、NaN、Infinity、乱字符串都算读不出来） */
export function parseNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? (v === 0 ? 0 : v) : null;
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  // 全角 → 半角：数字、逗号、圆括号、正负号等
  s = s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  let neg = false;
  const paren = s.match(/^\((.*)\)$/);
  if (paren) {
    neg = true;
    s = paren[1];
  }
  s = s
    .replace(/[,\s]/g, "")
    .replace(/[¥￥$]/g, "")
    .replace(/(元|天|个|次|人|月|年|日|项|台|套|小时|时|%|％)$/, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const r = neg ? -n : n;
  return r === 0 ? 0 : r; // 归一化 -0（`(0)` 不该产出 -0 这种「负零」）
}

/** 解析外部输入，读不出来用 d 兜底（默认 0） */
export function numOr(v: unknown, d = 0): number {
  return parseNum(v) ?? d;
}

/**
 * 同 `numOr`，但「填了东西却读不出数」时留一条 warn 痕迹。
 * 空值/未填（""、null、undefined、纯空格）不算异常，不打扰。
 */
export function numOrWarn(v: unknown, d: number, what: string): number {
  const n = parseNum(v);
  if (n !== null) return n;
  const empty = v == null || (typeof v === "string" && v.trim() === "");
  if (!empty) console.warn(`[数值] ${what} 读不出数字，按 ${d} 处理：`, v);
  return d;
}

/**
 * 1.7.13 起的旧名字（Excel 侧一直在用），等价 `numOr(v, 0)`。
 * 新代码在有「读不出来」需要区分时，用 `parseNum` / `numOrWarn`。
 */
export function parseNumber(v: unknown): number {
  return numOr(v, 0);
}
