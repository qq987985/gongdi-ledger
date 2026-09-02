import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "~/components/ui/input";
import { Need } from "~/components/can";
import {
  DocActions,
  DOC_KIND_LABEL,
  invoiceBase,
  reportBase,
  receiptSubBase,
  receiptWorkerBase,
  attendanceBase,
} from "~/components/doc-actions";
import { useApp } from "~/lib/store";

function safeBase(s: string) {
  return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}

function FilesPage() {
  const {
    year,
    attendanceDocs,
    contracts,
    contractEntries,
    expenses,
    patchAttendanceDoc,
    removeAttendanceDocs,
    patchContractEntry,
    upsertContract,
    upsertExpense,
  } = useApp();
  const [kind, setKind] = React.useState("all");
  const [scope, setScope] = React.useState("year");
  const [q, setQ] = React.useState("");
  const taken = [
    ...(attendanceDocs || []).map((d: any) => d.fileName),
    ...(contractEntries || []).map((e: any) => e.fileName),
    ...(contracts || []).map((c: any) => c.scanFileName),
    ...(expenses || []).map((e: any) => e.voucherFileName),
    ...(expenses || []).map((e: any) => e.payoutFileName),
  ].filter(Boolean);
  const filtered = React.useMemo(() => {
    const out: any[] = [];
    for (const d of attendanceDocs || []) {
      if (scope === "year" && d.year !== year) continue;
      out.push({
        id: d.id,
        kind: "attendance",
        fileName: d.fileName,
        belong: `${d.year}年${d.month}月考勤`,
        extra: d.remark,
        suggest: attendanceBase(d.year, d.month),
        source: "attendance",
      });
    }
    const cmap = Object.fromEntries(contracts.map((c: any) => [c.id, c]));
    for (const e of contractEntries || []) {
      if (e.kind !== "report" && e.kind !== "invoice" && e.kind !== "receipt") continue;
      const c = cmap[e.contractId];
      if (scope === "year" && c && c.year !== year) continue;
      if (!e.fileName) continue;
      const name = c?.name || "未命名";
      const suggest =
        e.kind === "invoice"
          ? invoiceBase(name, e.date, e.amount)
          : e.kind === "report"
            ? reportBase(name, e.date, e.amount)
            : e.payTo === "worker"
              ? receiptWorkerBase(name, e.date)
              : receiptSubBase(name, e.date);
      out.push({
        id: e.id,
        kind: e.kind,
        fileName: e.fileName,
        belong: c ? `${c.year} ${c.name}` : "合同",
        extra: [e.date, e.payTo === "worker" ? "代付农民工" : e.kind === "receipt" ? "到分包" : "", e.no, e.remark]
          .filter(Boolean)
          .join(" · "),
        suggest,
        source: "contract",
      });
    }
    for (const c of contracts || []) {
      if (!c.scanFileName) continue;
      if (scope === "year" && c.year !== year) continue;
      out.push({
        id: c.id,
        kind: "contract",
        fileName: c.scanFileName,
        belong: `${c.year} ${c.name}`,
        extra: "合同扫描件",
        suggest: `${safeBase(c.name)}-合同电子版`,
        source: "scan",
      });
    }
    const seenV = new Set<string>();
    for (const e of expenses || []) {
      if (!e.voucherFileName || !e.voucherId) continue;
      if (scope === "year" && e.year !== year) continue;
      if (seenV.has(e.voucherId)) continue;
      seenV.add(e.voucherId);
      out.push({
        id: e.voucherId,
        kind: "expense",
        fileName: e.voucherFileName,
        belong: `${e.year} ${e.name}`,
        extra: [e.payMethod, e.status].filter(Boolean).join(" · "),
        suggest: `${safeBase(e.name)}-${e.amount}`,
        source: "expense",
      });
    }
    const seenP = new Set<string>();
    for (const e of expenses || []) {
      if (!e.payoutFileName || !e.payoutId) continue;
      if (scope === "year" && e.year !== year) continue;
      if (seenP.has(e.payoutId)) continue;
      seenP.add(e.payoutId);
      const group = (expenses || []).filter((x: any) => x.payoutId === e.payoutId);
      const sib = group.length;
      const total = group.reduce((s: number, x: any) => s + (x.amount || 0), 0);
      const amt = Number.isInteger(total) ? String(total) : String(Math.round(total * 100) / 100);
      out.push({
        id: e.payoutId,
        kind: "payout",
        fileName: e.payoutFileName,
        belong: `${e.year} ${e.claimant || e.name}`,
        extra: [e.payAccount, e.forWhom || e.claimant, sib > 1 ? `${sib}笔一起` : "", e.payoutDate, e.status]
          .filter(Boolean)
          .join(" · "),
        suggest: `收报销款-${amt}-${sib}笔`,
        source: "payout",
      });
    }
    return out;
  }, [attendanceDocs, contractEntries, contracts, expenses, year, scope]).filter((r) => {
    if (kind !== "all" && r.kind !== kind) return false;
    if (!q.trim()) return true;
    const s = q.trim();
    return [r.fileName, r.belong, r.extra, DOC_KIND_LABEL[r.kind]].some((x) => x.includes(s));
  });
  return (
    <Need perm="files.view">
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl font-semibold">影像资料</h1>
          <p className="mt-1 text-sm text-muted">
            文件在 NAS 的 data/photos 下：报量单、发票、收款回单、考勤影像、合同扫描件、报销凭证、报销打款。可查看、下载、复制、替换、删除。
          </p>
        </header>
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
          <label className="text-sm">
            <span className="text-xs text-muted">类型</span>
            <select className="field-select mt-1 w-auto" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">全部</option>
              <option value="attendance">考勤影像</option>
              <option value="report">报量单</option>
              <option value="invoice">电子发票</option>
              <option value="receipt">收款回单</option>
              <option value="contract">合同扫描件</option>
              <option value="expense">报销凭证</option>
              <option value="payout">报销打款</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-xs text-muted">年份</span>
            <select className="field-select mt-1 w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="year">{year}年</option>
              <option value="all">全部年份</option>
            </select>
          </label>
          <label className="min-w-48 flex-1 text-sm">
            <span className="text-xs text-muted">搜索</span>
            <Input className="mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="文件名 / 项目 / 报销人 / 账户" />
          </label>
        </div>
        <p className="text-sm text-muted">共 {filtered.length} 份</p>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="p-3">类型</th>
                <th className="p-3">归属</th>
                <th className="p-3">文件</th>
                <th className="p-3">说明</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-muted">
                    还没有影像资料。到月度考勤、合同流水或合同扫描件里上传。
                  </td>
                </tr>
              ) : null}
              {filtered.map((r: any) => (
                <tr key={`${r.kind}-${r.id}`} className="border-b border-line last:border-0">
                  <td className="p-3">{DOC_KIND_LABEL[r.kind]}</td>
                  <td className="p-3">{r.belong}</td>
                  <td className="p-3 font-medium">{r.fileName}</td>
                  <td className="p-3 text-muted">{r.extra || "—"}</td>
                  <td className="p-3">
                    <DocActions
                      id={r.id}
                      kind={r.kind}
                      fileName={r.fileName}
                      suggest={r.suggest}
                      taken={taken}
                      onReplaced={(name) => {
                        if (r.source === "attendance") patchAttendanceDoc(r.id, { fileName: name });
                        else if (r.source === "scan") {
                          const c = contracts.find((x: any) => x.id === r.id);
                          if (c) upsertContract({ ...c, scanFileName: name });
                        } else if (r.source === "expense") {
                          for (const e of expenses || []) {
                            if (e.voucherId === r.id) upsertExpense({ ...e, voucherFileName: name });
                          }
                        } else if (r.source === "payout") {
                          for (const e of expenses || []) {
                            if (e.payoutId === r.id) upsertExpense({ ...e, payoutFileName: name });
                          }
                        } else patchContractEntry(r.id, { fileName: name });
                      }}
                      onDeleted={() => {
                        if (r.source === "attendance") removeAttendanceDocs([r.id]);
                        else if (r.source === "scan") {
                          const c = contracts.find((x: any) => x.id === r.id);
                          if (c) upsertContract({ ...c, scanFileName: "" });
                        } else if (r.source === "expense") {
                          for (const e of expenses || []) {
                            if (e.voucherId === r.id) upsertExpense({ ...e, voucherFileName: "", voucherId: "" });
                          }
                        } else if (r.source === "payout") {
                          for (const e of expenses || []) {
                            if (e.payoutId === r.id) upsertExpense({ ...e, payoutFileName: "", payoutId: "" });
                          }
                        } else patchContractEntry(r.id, { fileName: "" });
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/files")({
  component: FilesPage,
});
