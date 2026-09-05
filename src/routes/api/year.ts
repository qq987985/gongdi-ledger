import { createFileRoute } from "@tanstack/react-router";
import { persistOn, readLedger, writeLedger } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

async function addYearAndRedirect(request: Request, year: number) {
  const referer = request.headers.get("referer");
  let back = "/";
  try {
    if (referer) back = new URL(referer).pathname || "/";
  } catch {
    back = "/";
  }
  if (year < 2e3 || year > 2100) return Response.redirect(new URL(back, request.url), 303);
  if (!persistOn()) {
    const url = new URL(back, request.url);
    url.searchParams.set("addYear", String(year));
    return Response.redirect(url, 303);
  }
  const data = await readLedger();
  const rec = !("empty" in data && data.empty) ? data : { year: 2026, years: [2026], people: [], attendance: [], payments: [], accessHash: "" };
  const years = Array.isArray(rec.years) ? [...rec.years] : [2026];
  if (!years.includes(year)) years.push(year);
  years.sort((a: number, b: number) => a - b);
  await writeLedger({ ...rec, years, year });
  return Response.redirect(new URL(back, request.url), 303);
}

export const Route = createFileRoute("/api/year")({
  server: {
    handlers: {
      GET: async () => Response.json({ error: "请在月度考勤里新增年份" }, { status: 405 }),
      POST: async ({ request }) => {
        const form = await request.formData();
        const year = Number(form.get("year") || form.get("add") || 0);
        // 需登录 + settings.year 权限，并写入当前台账
        return withTenant(request, () => addYearAndRedirect(request, year), "settings.year");
      },
    },
  },
});
