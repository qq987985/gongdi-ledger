import * as React from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Can } from "~/components/can";
import { WinUpdate } from "~/components/shell/win-update";
import { VersionLog } from "~/components/shell/version-log";
import { UiStyleCard } from "~/components/settings/ui-style-card";
import { PasswordCard } from "~/components/settings/password-card";
import { MembersCard } from "~/components/settings/members-card";
import { AccountsCard } from "~/components/settings/accounts-card";
import { BatchRules } from "~/components/settings/batch-rules";
import { useApp } from "~/lib/store";
import { derivedYears, monthStatus, nextYear, confirmRemoveYear } from "~/lib/dates";
import { pushNasBackup } from "~/lib/nas-sync";
import { nasEnabled } from "~/lib/nas-flag";
import { backupKeep } from "~/lib/backup-keep";
import { clearAllPhotos } from "~/lib/photos";
import { authStatus, authOp } from "~/lib/auth";
import { confirmLeaveUnsaved } from "~/lib/unsaved";

function SettingsPage() {
  const store = useApp();
  const { year, setYear, addYear, removeYear, people, replacePeople, clearAll, attendance } = store;
  const years = derivedYears(store);
  const [custom, setCustom] = React.useState(nextYear(years));
  const [wage, setWage] = React.useState(0);
  const [monthWage, setMonthWage] = React.useState(0);
  const [payType, setPayType] = React.useState("day");
  const [rule, setRule] = React.useState("");
  const [clearPwd, setClearPwd] = React.useState("");
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  // 备份 / 影像归入都是「点一下、等几秒」的操作：请求期间禁用按钮，
  // 否则连点两下会生成两份备份、或同时跑两遍归入（1.8.1）
  const [backingUp, setBackingUp] = React.useState(false);
  // 备份内容回执（F2 / A13）：备份成功后写「已备份 N 人 / M 笔发放 / K 条报销 / J 份合同」，
  // 让用户肉眼核对这份文件里到底有没有报销和合同
  const [backupInfo, setBackupInfo] = React.useState("");
  const [adopting, setAdopting] = React.useState(false);
  
  React.useEffect(() => {
    authStatus().then((s) => setIsAdmin(s.user?.role === "admin"));
  }, []);
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-muted">年度、访问密码、批量工资。反代到公网请先设密码。</p>
      </header>
      {/* grid-cols-1：不写的话手机（单列）用的是隐式 auto 轨道，按 max-content 撑开 ——
          卡片比列宽还宽 30px，外层 overflow-x-hidden 一裁右边的字就看不见了（1.8.4 手机实测） */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AccountsCard />
        <UiStyleCard />
        <MembersCard />
        <PasswordCard />
        <Can perm="settings.year">
          <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">已展开的年度</h2>
          <p className="mt-1 text-sm text-muted">
            当前工作年 {year}。新增年份不会改人员。删除年份只去掉该年考勤，人员、照片、发放记录保留。至少留一年。
          </p>
          <ul className="mt-4 space-y-2">
            {years.map((y) => {
              const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
              return (
                <li key={y} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                  <button type="button" className="text-left text-sm" onClick={() => { if (!confirmLeaveUnsaved("换年份后这张月表会重新填")) return; setYear(y); }}>
                    <span className="font-medium">{y} 年</span>
                    <span className="ml-2 text-xs text-muted">
                      {filled}/12 月已录{y === year ? " · 当前" : ""}
                    </span>
                  </button>
                  {years.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirmRemoveYear(y, filled)) return;
                        try {
                          if (nasEnabled()) await pushNasBackup();
                        } catch {}
                        removeYear(y);
                        toast.success(`已删除 ${y} 年考勤。人员与发放记录仍在。`);
                      }}
                    >
                      删除
                    </Button>
                  ) : (
                    <span className="text-xs text-subtle">至少留一年</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              type="number"
              className="w-28"
              value={custom}
              onChange={(e) => setCustom(Number(e.target.value))}
              aria-label="要新增的年份"
            />
            <Button
              onClick={() => {
                if (custom < 2000 || custom > 2100) {
                  toast.error("请输入 2000–2100 的年份");
                  return;
                }
                const created = addYear(custom);
                toast.success(`${created} 年已展开`);
                setCustom(created + 1);
              }}
            >
              展开该年
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const created = addYear();
                toast.success(`${created} 年已展开`);
                setCustom(created + 1);
              }}
            >
              新增下一年
            </Button>
          </div>
        </section>
      </Can>
      <Can perm="settings.rules">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">批量工资 / 加班规则</h2>
          <p className="mt-1 text-sm text-muted">勾选人再应用。计薪选按工天或按月。加班选按小时或按折算。</p>
          <BatchRules
            people={people}
            replacePeople={replacePeople}
            wage={wage}
            setWage={setWage}
            monthWage={monthWage}
            setMonthWage={setMonthWage}
            payType={payType}
            setPayType={setPayType}
            rule={rule}
            setRule={setRule}
          />
        </section>
      </Can>
      <Can perm="settings.data">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">数据</h2>
          <p className="mt-1 text-sm text-muted">
            {isAdmin 
              ? "清空全部数据后可用模板导入。示例数据请在「导入」页面下载模板查看。"
              : "示例数据请在「导入」页面下载模板查看。"}
            {nasEnabled()
              ? " 全部个人数据只在 NAS 的 data 目录：accounts、books、photos、backups、templates。软件删了重装，只要 data 还在就能恢复。"
              : ""}
          </p>
          {nasEnabled() ? (
            <p className="mt-1 text-xs text-subtle">
              备份保留策略：data/backups 里带时间戳的备份只留最近 {backupKeep()} 份（旧备份会自动清理），
              固定名「考勤表.xlsx」永远是最新一份、不会被删。份数可用环境变量 BACKUP_KEEP 调整。
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {nasEnabled() ? (
              <Button
                type="button"
                disabled={backingUp}
                onClick={async () => {
                  if (backingUp) return;
                  setBackingUp(true);
                  try {
                    const r = await pushNasBackup();
                    toast.success(`已备份到 data/backups/${r.filename}`);
                    setBackupInfo(r.summary);
                  } catch {
                    toast.error("备份失败");
                  } finally {
                    setBackingUp(false);
                  }
                }}
              >
                {backingUp ? "备份中…" : "立即备份 Excel"}
              </Button>
            ) : null}
            {isAdmin && (
              !showClearConfirm ? (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                >
                  清空全部数据
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <span className="text-sm text-red-700">此操作不可恢复，请输入访问密码确认：</span>
                  <Input
                    type="password"
                    value={clearPwd}
                    onChange={(e) => setClearPwd(e.target.value)}
                    placeholder="输入访问密码"
                    className="w-40"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={async () => {
                      try {
                        const { user } = await authOp("verify", { password: clearPwd });
                        if (!user) {
                          toast.error("密码错误");
                          return;
                        }
                        if (user.role !== "admin") {
                          toast.error("只有管理员才能清空全部数据");
                          setShowClearConfirm(false);
                          setClearPwd("");
                          return;
                        }
                        if (!confirm("确定清空全部人员、考勤、发放和照片？此操作不可恢复！")) return;
                        clearAll();
                        await clearAllPhotos();
                        toast.success("已清空全部数据");
                        setShowClearConfirm(false);
                        setClearPwd("");
                      } catch (e: any) {
                        toast.error(e.message || "验证失败");
                      }
                    }}
                  >
                    确认清空
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setShowClearConfirm(false);
                      setClearPwd("");
                    }}
                  >
                    取消
                  </Button>
                </div>
              )
            )}
          </div>
          {/* F2：备份内容回执 —— 「已备份 N 人 / M 笔发放 / K 条报销 / J 份合同」，肉眼核对 */}
          {backupInfo ? (
            <p className="mt-2 text-xs text-muted" data-testid="backup-info">
              {backupInfo}
            </p>
          ) : null}
        </section>
      </Can>
      {/* 影像归入本台账：老版本的影像放在全局目录里，按台账分区后需要一次性归入 */}
      <Can perm="photos.edit">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">影像归入本台账</h2>
          <p className="mt-1 text-xs text-muted">
            现在的照片和合同扫描件按台账分开存放。早期版本存在公共目录里的影像，可以在这里按<b>本台账的人员姓名与合同/报销</b>一次性归入本台账。
            只复制、不删除、不覆盖；原文件保持不动，随时可回退。归入后旧位置仍然能读到，可以先做一次再核对。
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            type="button"
            disabled={adopting}
            onClick={async () => {
              if (adopting) return;
              if (!confirm("把历史公共目录里的影像按姓名/合同归入本台账？\n\n不会删除、不会覆盖已有文件。")) return;
              setAdopting(true);
              try {
                const r = await fetch("/api/photo-adopt", { method: "POST", credentials: "include" });
                const j = await r.json();
                if (!r.ok) throw new Error(j?.error || "归入失败");
                toast.success(`已归入照片 ${j.photos || 0} 个、文档 ${j.docs || 0} 个${j.skipped ? `，跳过已存在 ${j.skipped} 个` : ""}`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "归入失败");
              } finally {
                setAdopting(false);
              }
            }}
          >
            {adopting ? "归入中…" : "开始归入"}
          </Button>
        </section>
      </Can>
      </div>
      {/* 软件更新放最底部 */}
      <div className="flex flex-wrap items-center gap-2">
        <WinUpdate compact />
        <span className="text-xs text-muted">当前版本：</span>
        <VersionLog />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
