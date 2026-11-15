import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { availableTeamNames, mergeTeams, teamNameError, TEAM_NAME_LIMIT } from "../src/lib/teams";
import { buildBackupWorkbook, backupCounts, backupSummaryText } from "../src/lib/backup-book";
import { buildFullWorkbook, parseFullAttendanceWorkbook } from "../src/lib/excel";
import { teamRows } from "../src/lib/attendance-summary";

test("可选班组包括空班组和人员历史班组，合并空白差异但不改历史字段", () => {
  const teams = [{ id: "empty", name: "尚未进场" }];
  const people = [{ team: " 旧班组 " }, { team: "旧班组" }, { team: "已用班组" }, { team: "已用班组" }, { team: "" }];
  const names = availableTeamNames(teams, people);
  assert.equal(names.length, 3);
  assert.ok(names.includes("尚未进场"));
  assert.ok(names.includes("旧班组"));
  assert.deepEqual(people[0], { team: " 旧班组 " }, "不能为建立班组列表改写历史人员");
  assert.deepEqual(teamRows(people, names).map(({ team, count }) => ({ team, count })), [{ team: "旧班组", count: 2 }, { team: "已用班组", count: 2 }, { team: "未分班组", count: 1 }, { team: "尚未进场", count: 0 }].sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, "zh")));
});

test("真实未分班组名称与历史空值桶共存，展示标签和React键都不冲突", () => {
  const rows = teamRows([{ team: "" }], ["未分班组", "__all__"]);
  assert.equal(new Set(rows.map((row) => row.key)).size, rows.length);
  assert.deepEqual(rows.find((row) => row.key === ""), { key: "", team: "未分班组", count: 1 });
  assert.deepEqual(rows.find((row) => row.key === "未分班组"), { key: "未分班组", team: "未分班组（班组名）", count: 0 });
  assert.equal(rows.reduce((sum, row) => sum + row.count, 0), 1);
});

test("创建班组trim并拒绝空名、超长名、已有空班组及历史人员班组重名", () => {
  const existing = [{ id: "a", name: "一班" }];
  assert.equal(teamNameError(" 二班 ", existing), "");
  assert.match(teamNameError("  ", existing), /填写/);
  assert.match(teamNameError("a".repeat(TEAM_NAME_LIMIT + 1), existing), /最多/);
  assert.match(teamNameError(" 一班 ", existing), /同名/);
  assert.match(teamNameError("旧班组", existing, [{ team: " 旧班组 " }]), /同名/);
});

test("班组合并保留原ID，处理外来ID冲突，重复恢复幂等", () => {
  const existing = [{ id: "a", name: "一班" }];
  const incoming = [{ id: "new-a", name: " 一班 " }, { id: "a", name: "二班" }, { id: "c", name: "三班" }];
  const first = mergeTeams(existing, incoming);
  assert.equal(first.added, 2);
  assert.deepEqual(first.teams[0], existing[0]);
  assert.notEqual(first.teams[1].id, "a");
  assert.equal(first.teams[2].id, "c");
  assert.equal(new Set(first.teams.map((team) => team.id)).size, 3);
  assert.deepEqual(mergeTeams(first.teams, incoming), { teams: first.teams, added: 0 });
});

test("无人班组在备份和整本XLSX往返保留，二次恢复不新增，旧文件仍可解析", () => {
  const input = { year: 2026, teams: [{ id: "empty-team", name: "待进场" }, { id: "header-word", name: "姓名" }], people: [], attendance: [], payments: [] };
  const bytes = (workbook: XLSX.WorkBook) => XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  for (const workbook of [buildBackupWorkbook(input), buildFullWorkbook(input)]) {
    assert.ok(workbook.SheetNames.includes("班组列表"));
    const parsed = parseFullAttendanceWorkbook(bytes(workbook), 2026);
    assert.equal(parsed.people.length, 0);
    assert.deepEqual(parsed.teams, input.teams);
    const restored = mergeTeams([], parsed.teams);
    assert.equal(restored.added, 2);
    assert.equal(mergeTeams(restored.teams, parsed.teams).added, 0);
    const second = parseFullAttendanceWorkbook(bytes(buildBackupWorkbook({ ...input, teams: restored.teams })), 2026);
    assert.deepEqual(second.teams, input.teams);
  }
  const counts = backupCounts(input);
  assert.equal(counts.teams, 2);
  assert.match(backupSummaryText(counts), /2 个班组/);
  const old = parseFullAttendanceWorkbook(bytes(buildFullWorkbook({ ...input, teams: undefined })), 2026);
  assert.deepEqual(old.teams, []);
});
