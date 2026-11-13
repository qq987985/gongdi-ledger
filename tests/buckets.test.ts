import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_BUCKETS, bucketRaw, groupBuckets, inBucket } from "../src/lib/buckets";
import { monthTeamTables } from "../src/lib/attendance-month";
import { teamRows } from "../src/lib/attendance-summary";

test("真实名称与全部哨兵同名时仍是独立桶，前缀名称和空值也互不冲突", () => {
  const names = [ALL_BUCKETS, "__bucket__:__all__", "__empty__", "普通组", ""];
  const buckets = groupBuckets(names, "未分班组");
  assert.equal(new Set(buckets.map((bucket) => bucket.value)).size, names.length);
  assert.ok(!buckets.some((bucket) => bucket.value === ALL_BUCKETS));
  for (const name of names) {
    const bucket = buckets.find((item) => item.label === (name || "未分班组"))!;
    assert.equal(bucketRaw(bucket.value), name);
    assert.deepEqual(names.filter((value) => inBucket(value, bucket.value)), [name]);
  }
  assert.ok(names.every((name) => inBucket(name, ALL_BUCKETS)));
});

test("特殊班组的打印表与首页人数只使用该组成员，不串组、不重算其他人的工作量", () => {
  const rows = [
    { name: "甲", team: ALL_BUCKETS, days: 1, otHours: 2 },
    { name: "乙", team: "普通组", days: 3, otHours: 4 },
  ];
  const bucket = groupBuckets(rows.map((row) => row.team), "未分班组").find((item) => item.label === ALL_BUCKETS)!;
  const tables = monthTeamTables(rows, bucket.value);
  assert.equal(tables.length, 1);
  assert.deepEqual(tables[0].rows.map((row) => row.name), ["甲"]);
  assert.deepEqual(tables[0].totals, { people: 1, days: 1, otHours: 2 });
  assert.equal(tables[0].team, ALL_BUCKETS, "业务字段保持真实名称");
  assert.deepEqual(teamRows(rows).find((row) => row.team === ALL_BUCKETS), { team: ALL_BUCKETS, count: 1 });
});
