import { createFileRoute } from "@tanstack/react-router";
import { Need } from "~/components/can";
import { PeopleImport, PaymentImport, ContractImport, FullBookImport, AttendanceImport, ExpenseImport, TplLink } from "~/components/excel-import";

function ImportPage() {
  return (
    <Need perm="import.use">
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl font-semibold">导入</h1>
          <p className="mt-1 text-sm text-muted">
            先下模板、按模板填好，再上传。年份在文件名里，或自动按当前年份。要导出请到「导出」页。
          </p>
        </header>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">分模块导入</h2>
          <p className="mt-1 text-sm text-muted">人员、考勤、发放、报销、合同都可以单独导入，导入时可选择「增加」或「替换」。</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-semibold">人员</h3>
              <p className="mt-1 text-sm text-muted">姓名、班组、身份证、工资、加班等。按姓名去重。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TplLink href="/api/file/people-template" filename="人员导入模板.xlsx" />
                <PeopleImport />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-semibold">考勤</h3>
              <p className="mt-1 text-sm text-muted">月份、姓名、工天、加班、补助、扣款。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TplLink href="/api/file/attendance-template" filename="考勤导入模板.xlsx" />
                <AttendanceImport />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-semibold">发放</h3>
              <p className="mt-1 text-sm text-muted">实际收款人、金额、日期、发放方、收款人。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TplLink href="/api/file/payment-template" filename="发放记录导入模板.xlsx" />
                <PaymentImport />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-semibold">报销</h3>
              <p className="mt-1 text-sm text-muted">项目、金额、支付方式、报销人、收款人、开户行、打款账户。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TplLink href="/api/file/expense-template" filename="报销单导入模板.xlsx" />
                <ExpenseImport />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5 md:col-span-2">
              <h3 className="font-semibold">合同</h3>
              <p className="mt-1 text-sm text-muted">项目名称、金额、进度、报量 / 开票 / 收款。按年+名称+编号去重。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TplLink href="/api/file/contract-template" filename="合同导入模板.xlsx" />
                <ContractImport />
              </div>
            </div>
          </div>
        </section>
        <section className="rounded-xl border border-dashed border-line-strong bg-bg-elevated p-5">
          <h2 className="font-semibold">导入整本台账</h2>
          <p className="mt-1 text-sm text-muted">一次写入人员、各月考勤、发放、报销。合同仍用上面单独导入。</p>
          <div className="mt-3">
            <FullBookImport />
          </div>
        </section>
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/import")({
  component: ImportPage,
});
