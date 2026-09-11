import { buildExpenseWorkbook, buildFullWorkbook, parseExpenseSheet, parseFullAttendanceWorkbook } from "../../src/lib/excel";
import { check, eq } from "./harness";
import { buf, expense, handWb, person } from "./fixtures";

const HEAD = [
  "序号", "年份", "项目名称", "购买时间", "期间", "单位", "数量", "单价", "金额", "支付方式",
  "打款方式", "状态", "报销人", "收款人", "开户行", "打款账户", "打款日期", "备注", "凭证文件", "打款凭证",
];

export function runExpenses() {
  check("报销", "逐字段往返：金额/日期/状态/报销人/收款人/打款信息/凭证文件名/打款凭证", () => {
    const back = parseExpenseSheet(buf(buildExpenseWorkbook([expense()])), 2026)[0];
    eq(
      {
        name: back.name, year: back.year, date: back.date, period: back.period, unit: back.unit,
        qty: back.qty, price: back.price, amount: back.amount, status: back.status,
        payMethod: back.payMethod, payoutMethod: back.payoutMethod, claimant: back.claimant,
        forWhom: back.forWhom, payBank: back.payBank, payCardNo: back.payCardNo,
        payoutDate: back.payoutDate, remark: back.remark,
        voucherFileName: back.voucherFileName, payoutFileName: back.payoutFileName,
      },
      {
        name: "办公用品", year: 2026, date: "2026-04-01", period: "2026-04", unit: "项",
        qty: 2, price: 150, amount: 300, status: "未报销",
        payMethod: "现金", payoutMethod: "转账", claimant: "李四",
        forWhom: "李四", payBank: "中国建设银行北京支行", payCardNo: "6217001234567890123",
        payoutDate: "2026-04-20", remark: "报销备注",
        voucherFileName: "发票-办公用品.pdf", payoutFileName: "打款凭证.png",
      },
      "报销字段",
    );
  });

  check("报销", "已报销状态往返（不能被当成未报销）", () => {
    const back = parseExpenseSheet(buf(buildExpenseWorkbook([expense({ status: "已报销" })])), 2026)[0];
    eq(back.status, "已报销", "状态");
  });

  check("报销", "整本导出→整本导入：报销金额/凭证文件名不丢", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [], payments: [], expenses: [expense()],
      months: [{ year: 2026, month: 4 }],
    });
    const rows = parseFullAttendanceWorkbook(buf(wb), 2026).expenses;
    eq(rows.map((e) => [e.amount, e.voucherFileName, e.payoutFileName]), [[300, "发票-办公用品.pdf", "打款凭证.png"]], "报销行");
  });

  check("报销", "「合计」行不算一条报销记录", () => {
    const wb = handWb("报销单", [HEAD, [1, 2026, "办公用品", "2026-04-01", "", "项", 1, 300, 300, "现金", "转账", "未报销", "李四", "李四", "", "", "", "", "", ""], ["合计", "", "", "", "", "", "", "", 300, "", "", "", "", "", "", "", "", "", "", ""]]);
    eq(parseExpenseSheet(buf(wb), 2026).length, 1, "报销条数");
  });

  check("报销", "金额 0 / 数量 0 的报销单往返后仍是 0（不被 数量×单价 重算、不被改成 1）", () => {
    const a = parseExpenseSheet(buf(buildExpenseWorkbook([expense({ amount: 0, qty: 2, price: 150 })])), 2026)[0];
    const b = parseExpenseSheet(buf(buildExpenseWorkbook([expense({ qty: 0, price: 0, amount: 0 })])), 2026)[0];
    eq([a.amount, b.qty, b.price, b.amount], [0, 0, 0, 0], "金额为0的数量/单价/金额 + 数量为0的行");
  });

  check("报销", "金额 1e9 / 负数 往返不变", () => {
    const back = parseExpenseSheet(buf(buildExpenseWorkbook([expense({ amount: 1e9, qty: 1, price: 1e9 }), expense({ id: "x2", name: "退款", amount: -200, qty: 1, price: -200 })])), 2026);
    eq(back.map((e) => e.amount), [1e9, -200], "金额");
  });

  check("报销", "报销日期非法（2026-13-01）原样保留、不丢记录", () => {
    const back = parseExpenseSheet(buf(buildExpenseWorkbook([expense({ date: "2026-13-01", period: "" })])), 2026);
    eq([back.length, back[0].date], [1, "2026-13-01"], "日期");
  });
}
