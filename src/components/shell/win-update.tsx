import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { formatVersion } from "~/lib/changelog";

export function WinUpdate({ compact }: { compact?: boolean }) {
  const [info, setInfo] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  async function load(fresh: boolean) {
    try {
      const d = await (
        await fetch(fresh ? "/api/update?fresh=1" : "/api/update", {
          cache: "no-store",
          signal: AbortSignal.timeout(2e4),
        })
      ).json();
      setInfo(d);
      return d;
    } catch {
      setInfo({ error: "检查失败" });
      return null;
    }
  }
  React.useEffect(() => {
    load(true);
  }, []);
  /** 轮询 /api/version：既判断服务有没有回来，也拿到真实版本号（用来核对更新到底成没成） */
  async function pollVersion(tries: number): Promise<{ back: boolean; version: string }> {
    for (let i = 0; i < tries; i++) {
      await new Promise((r) => setTimeout(r, 3e3));
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) continue;
        const j = (await r.json()) as { current?: string };
        return { back: true, version: String(j?.current || "") };
      } catch {}
    }
    return { back: false, version: "" };
  }
  /** 更新已受理后的收尾：等服务回来、核对版本真的变了再刷新 */
  async function finishUpdate(target: string, pulled = "") {
    const p = await pollVersion(40);
    if (!p.back) {
      toast.error("服务 2 分钟内没有恢复。请到 NAS 执行 docker ps -a | grep attendance 查看容器状态");
      setBusy(false);
      return;
    }
    if (target && p.version && formatVersion(p.version) !== formatVersion(target)) {
      // 说清「本次拉到的镜像是哪个版本」：拉到旧镜像时容器确实换过了，但内容还是旧的，
      // 只报「版本没变」会让人以为程序坏了。
      toast.error(
        pulled
          ? `已重启，但版本还是 ${formatVersion(p.version)}（期望 ${formatVersion(target)}）：本次拉到的镜像就是 ${formatVersion(pulled)}，` +
            `是镜像加速站还在发旧镜像。等 5–10 分钟再点一次「更新」即可（详情见「查看更新日志」）。`
          : `已重启，但版本还是 ${formatVersion(p.version)}（期望 ${formatVersion(target)}）；点「查看更新日志」能看到本次拉到的镜像版本。`,
      );
      setBusy(false);
      return;
    }
    location.reload();
  }
  /** 轮询后台更新任务进度；轮询本身失败 = 容器正在被替换，转入等待重启 */
  async function pollJob(): Promise<{ settled: boolean; ok: boolean; error: string; imageVersion: string }> {
    for (let i = 0; i < 150; i++) {
      await new Promise((r) => setTimeout(r, 2e3));
      try {
        const r = await fetch("/api/update?status=1", { cache: "no-store" });
        if (!r.ok) continue;
        const j = (await r.json()) as { status?: { running?: boolean; ok?: boolean; error?: string; imageVersion?: string } };
        const s = j.status;
        if (!s) continue;
        if (s.running) continue;
        return { settled: true, ok: Boolean(s.ok), error: String(s.error || ""), imageVersion: String(s.imageVersion || "") };
      } catch {
        return { settled: false, ok: false, error: "", imageVersion: "" }; // 服务已下线，进入等重启阶段
      }
    }
    return { settled: false, ok: false, error: "", imageVersion: "" };
  }
  async function apply() {
    const docker = info?.mode === "docker";
    const target = String(info?.remote || "");
    if (!confirm(docker ? "将拉取新镜像并重启容器。data 台账不会动。大约一两分钟。" : "将下载新版本并重启。data 台账不会动。")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/update?apply=1", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok || d.error) {
        // 服务端明确说失败：把原因原样显示出来（以前空原因会被兜底成「更新失败」，看不出所以然）
        toast.error(d.error || `更新未执行（HTTP ${r.status}；详情见 data/logs）`);
        setBusy(false);
        return;
      }
      toast.success("已开始更新（拉镜像/替换容器），请稍候…");
      const job = await pollJob();
      if (job.settled && !job.ok) {
        toast.error(job.error || "更新失败；详情见 data/logs/update.log");
        setBusy(false);
        return;
      }
      void finishUpdate(target, job.imageVersion);
    } catch {
      // 请求中断不等于失败：容器/进程被替换时响应本来就会被切断。去问服务端真实结果。
      toast.message("更新请求中断，正在确认服务状态…");
      const p = await pollVersion(10);
      if (p.back && (!target || formatVersion(p.version) === formatVersion(target))) {
        toast.success(`已更新到 ${formatVersion(p.version)}`);
        location.reload();
        return;
      }
      toast.error(
        p.back
          ? `更新似乎没有生效，当前仍是 ${formatVersion(p.version)}；请查看 data/logs/update.log`
          : "更新请求中断且服务未响应；请查看 data/logs/update.log，或用「一键拉取 / 解压新包」手动更新",
      );
      setBusy(false);
    }
  }
  /** 上次更新的结果从哪来：GET /api/update 带的 status（服务端内存态，重启即清） */
  const job = info?.status as
    | { running?: boolean; startedAt?: number; doneAt?: number; ok?: boolean; error?: string; step?: string }
    | undefined;
  const stamp = (t?: number) => (t && t > 0 ? new Date(t).toLocaleString("zh-CN", { hour12: false }) : "");
  const [jobLog, setJobLog] = React.useState<{ log?: string; errorText?: string; note?: string; helper?: string } | null>(null);
  const [logBusy, setLogBusy] = React.useState(false);
  /** 把更新日志读回界面：以前只能去 NAS 一层层点开 data/logs/update.log */
  async function toggleLog() {
    if (jobLog) {
      setJobLog(null);
      return;
    }
    setLogBusy(true);
    try {
      const r = await fetch("/api/update-log", { cache: "no-store", signal: AbortSignal.timeout(2e4) });
      const d = (await r.json().catch(() => ({}))) as {
        log?: string;
        errorText?: string;
        note?: string;
        helper?: string;
        error?: string;
      };
      if (!r.ok || d.error) {
        toast.error(d.error || `读取日志失败（HTTP ${r.status}）`);
        return;
      }
      setJobLog(d);
    } catch {
      toast.error("读取日志失败（服务未响应）");
    } finally {
      setLogBusy(false);
    }
  }
  /** 清理 NAS 上遗留的旧镜像（一份几百 MB）：更新流程本身也会自动删上一个版本，这里给个手动入口 */
  const [pruneBusy, setPruneBusy] = React.useState(false);
  async function prune() {
    setPruneBusy(true);
    try {
      const r = await fetch("/api/images", { cache: "no-store", signal: AbortSignal.timeout(2e4) });
      const d = (await r.json().catch(() => ({}))) as {
        available?: boolean;
        removable?: { tags?: string[] }[];
        totalBytes?: number;
        note?: string;
        error?: string;
        helperContainer?: boolean;
      };
      if (!r.ok || d.error) {
        toast.error(d.error || `读取镜像失败（HTTP ${r.status}）`);
        return;
      }
      if (d.available === false) {
        toast.error(d.note || "本机没有挂载 docker.sock，无法清理");
        return;
      }
      const n = d.removable?.length || 0;
      if (!n && !d.helperContainer) {
        toast.success("没有可清理的旧镜像（当前版本和正在用的镜像不会被删）");
        return;
      }
      const mb = Math.round((d.totalBytes || 0) / 1048576);
      const helper = d.helperContainer ? "\n顺带删掉「更新容器 gongdi-updater」（它只是更新时的临时容器，删了不影响台账）。" : "";
      if (
        !confirm(
          `将删除 ${n} 个不再使用的旧镜像，约释放 ${mb} MB。\n当前运行的镜像与其它容器的镜像不会被删除。${helper}继续？`,
        )
      )
        return;
      const p = await fetch("/api/images", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const j = (await p.json().catch(() => ({}))) as {
        count?: number;
        freed?: number;
        errors?: string[];
        helperRemoved?: boolean;
        error?: string;
      };
      if (!p.ok || j.error) {
        toast.error(j.error || `清理失败（HTTP ${p.status}）`);
        return;
      }
      const freedMb = Math.round((j.freed || 0) / 1048576);
      const tail = j.helperRemoved ? "，并删掉了临时更新容器" : "";
      toast.success(
        j.count
          ? `已清理 ${j.count} 个旧镜像，释放约 ${freedMb} MB${tail}`
          : `没有旧镜像要清理${j.helperRemoved ? "（已删掉临时更新容器）" : ""}`,
      );
      if (j.errors?.length) toast.error(`有 ${j.errors.length} 个没删掉：${j.errors[0]}`);
    } catch {
      toast.error("清理失败（服务未响应）");
    } finally {
      setPruneBusy(false);
    }
  }
  const desc =
    info?.mode === "windows"
      ? "从 GitHub 下载 Windows 包并替换程序。data 不覆盖。"
      : info?.mode === "docker"
        ? "GitHub 有新版时点更新，会拉镜像并重启。data 台账不会动。"
        : "GitHub 有新版会在这里提醒。飞牛第一次请先运行一次「一键拉取」，以后就能点更新。";
  const status = !info
    ? "检查中…"
    : info.error && !info.remote
      ? info.error
      : info.canApply
        ? ""
        : info.hint || info.error || (info.newer ? "有新版本，请先在飞牛运行一次一键拉取" : "已是最新");
  return (
    <div className={compact ? "mt-3" : "rounded-xl border border-line bg-surface p-5"}>
      {compact ? null : (
        <>
          <h2 className="font-semibold">软件更新</h2>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </>
      )}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-3"}`}>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void load(true)}>
          检查更新
        </Button>
        {info?.canApply ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void apply()}>
            {busy ? "更新中…" : `更新到 ${formatVersion(info.remote)}`}
          </Button>
        ) : (
          <span className="text-xs text-muted">{status}</span>
        )}
      </div>
      {info?.hint && info.canApply ? <p className="mt-2 text-xs text-subtle">{info.hint}</p> : null}
      {info?.remote ? (
        <p className="mt-2 text-xs text-subtle">
          GitHub {formatVersion(info.remote)} · 本机 {formatVersion(info.local || "")}
        </p>
      ) : null}
      {job && (job.startedAt || job.running) ? (
        <div
          className={cn(
            "mt-3 rounded-lg border px-3 py-2 text-xs",
            job.running ? "border-warn/40 bg-warn-bg" : job.ok ? "border-ok/40 bg-ok-bg" : "border-danger/40 bg-danger-bg",
          )}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">上次更新</span>
            <span className={cn("font-medium", job.running ? "text-warn" : job.ok ? "text-ok" : "text-danger")}>
              {job.running ? "进行中…" : job.ok ? "成功" : "失败"}
            </span>
            {stamp(job.startedAt) ? (
              <span className="text-subtle">
                {stamp(job.startedAt)}
                {job.doneAt && !job.running ? ` → ${stamp(job.doneAt)}` : ""}
              </span>
            ) : null}
          </div>
          {job.running && job.step ? <p className="mt-1 text-subtle">{job.step}</p> : null}
          {!job.running && !job.ok && job.error ? <p className="mt-1 break-words text-muted">原因：{job.error}</p> : null}
          {!job.running && !job.ok ? (
            <p className="mt-1 text-subtle">
              容器还在旧版本上跑着，台账数据没动。可再点一次「更新」，或到 NAS 运行 ./一键拉取.sh。
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="text-xs text-muted underline underline-offset-2 hover:text-danger disabled:opacity-60"
          disabled={logBusy}
          onClick={() => void toggleLog()}
        >
          {logBusy ? "读取中…" : jobLog ? "收起更新日志" : "查看更新日志"}
        </button>
        <button
          type="button"
          className="text-xs text-muted underline underline-offset-2 hover:text-danger disabled:opacity-60"
          disabled={pruneBusy}
          onClick={() => void prune()}
        >
          {pruneBusy ? "清理中…" : "清理旧镜像"}
        </button>
      </div>
      {jobLog ? (
        jobLog.log || jobLog.errorText || jobLog.helper ? (
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-line bg-surface p-2 text-[11px] leading-relaxed text-muted">
            {[jobLog.errorText, jobLog.helper, jobLog.log].filter(Boolean).join(String.fromCharCode(10,10))}
          </pre>
        ) : (
          <p className="mt-1 text-xs text-subtle">{jobLog.note || "没有日志内容"}</p>
        )
      ) : null}
    </div>
  );
}
