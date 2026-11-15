import type { Person, Team } from "./types";
import { uid } from "./utils";

export const TEAM_NAME_LIMIT = 100;

/** 选择项合并空白差异，不改写人员的历史班组字段。 */
export function availableTeamNames(teams: readonly Team[] = [], people: readonly Pick<Person, "team">[] = []): string[] {
  return [...new Set([...teams.map((team) => team.name), ...people.map((person) => person.team)]
    .filter((name) => typeof name === "string" && name.trim()).map((name) => name.trim()))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function teamNameError(raw: string, teams: readonly Team[], people: readonly Pick<Person, "team">[] = []): string {
  const name = raw.trim();
  if (!name) return "请填写班组名称";
  if (name.length > TEAM_NAME_LIMIT) return `班组名称最多 ${TEAM_NAME_LIMIT} 字`;
  if (availableTeamNames(teams, people).some((value) => value.trim() === name)) return "已有同名班组，请直接选择";
  return "";
}

/** 整本恢复按名称补齐；保留既有 ID，外来 ID 冲突时为新增实体重新分配。 */
export function mergeTeams(existing: readonly Team[], incoming: readonly Team[]): { teams: Team[]; added: number } {
  const teams = existing.slice();
  const ids = new Set(teams.map((team) => team.id));
  for (const row of incoming) {
    if (teamNameError(row.name, teams)) continue;
    const id = row.id && !ids.has(row.id) ? row.id : uid();
    teams.push({ id, name: row.name.trim() });
    ids.add(id);
  }
  return { teams, added: teams.length - existing.length };
}
