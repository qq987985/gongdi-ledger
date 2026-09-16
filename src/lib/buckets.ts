/**
 * 筛选下拉的「分组桶」唯一实现（口径一致性专项 20260916）。
 *
 * 病根：各页面用 `[...new Set(rows.map(x => x.f).filter(Boolean))]` 造下拉选项，
 * `filter(Boolean)` 把**空值那一桶**悄悄删掉。于是「没填发放方 / 没填报销人 /
 * 没填队长 / 没填班组」的记录在列表和汇总里都算数，却在下拉里选不到 ——
 * 同一份数据四个口径（列表 / 汇总 / 分组面板 / 下拉）对不上。用户报的
 * 「发放记录页选全部发放方时漏项」就是这一型。
 *
 * 约定：
 * - `ALL_BUCKETS` 是「全部」这一项的固定 value，**不要**再用空串表示「全部」
 *   （空串要留给「未填」那一桶，否则两者抢同一个 value）。
 * - `groupBuckets` 返回真实存在的桶：非空值按 zh 排序，空值那一桶排在最后，
 *   标签由调用方给（如「未填发放方」「未分班组」「未填报销人」）。
 */

/** 「全部」选项的固定 value（空值桶要用空串，不能兼任「全部」） */
export const ALL_BUCKETS = "__all__";

export interface Bucket {
  value: string;
  label: string;
  /** 该桶是否为「未填」桶 */
  empty: boolean;
}

/**
 * 把一组字段值收成下拉选项：真实存在的非空值 + （存在时）一个「未填」桶。
 * @param values 原始字段值（可以是任何形状，内部 String 化并 trim）
 * @param emptyLabel 「未填」桶的显示文案
 */
export function groupBuckets(
  values: Iterable<string | null | undefined>,
  emptyLabel: string,
): Bucket[] {
  const seen = new Set<string>();
  let hasEmpty = false;
  for (const raw of values) {
    const v = String(raw ?? "").trim();
    if (!v) hasEmpty = true;
    else seen.add(v);
  }
  const out: Bucket[] = [...seen]
    .sort((a, b) => a.localeCompare(b, "zh"))
    .map((value) => ({ value, label: value, empty: false }));
  if (hasEmpty) out.push({ value: "", label: emptyLabel, empty: true });
  return out;
}

/** 某行的字段值是否落在选中的桶里（`ALL_BUCKETS` = 不过滤） */
export function inBucket(value: string | null | undefined, bucket: string): boolean {
  if (bucket === ALL_BUCKETS) return true;
  return String(value ?? "").trim() === bucket;
}
