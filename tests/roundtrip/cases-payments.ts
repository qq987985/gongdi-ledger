import { buildPaymentWorkbook, parsePaymentSheet } from "../../src/lib/excel";
import { check, eq } from "./harness";
import { buf, handWb, payment } from "./fixtures";

const PAY_HEAD = ["序号", "实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注"];

export function runPayments() {
  check("发放", "逐字段往返：实际收款人/收款人（代收）/日期/金额/发放方/备注", () => {
    const back = parsePaymentSheet(buf(buildPaymentWorkbook([payment({ receiver: "张三（代收）" })])))[0];
    eq([back.owner, back.receiver, back.date, back.amount, back.source, back.remark],
      ["张三", "张三（代收）", "2026-04-28", 10000, "示例工程4月请款", "本人"], "发放字段");
  });

  check("发放", "日期留空的发放记录往返后仍然为空（不是被填成 1970/其它日期）", () => {
    const back = parsePaymentSheet(buf(buildPaymentWorkbook([payment({ date: "" })])))[0];
    eq(back.date, "", "日期");
  });

  check("发放", "「合计」行不算一条发放记录", () => {
    const wb = handWb("发放记录", [[ "发放记录表"], PAY_HEAD, [1, "张三", "2026-04-28", 10000, "工程", "张三", ""], ["合计", "", "", 10000, "", "", ""]]);
    eq(parsePaymentSheet(buf(wb)).length, 1, "发放条数");
  });

  check("发放", "金额 1e9 / 负数 / 0 往返不变", () => {
    const back = parsePaymentSheet(buf(buildPaymentWorkbook([
      payment({ amount: 1e9, date: "2026-01-01" }),
      payment({ amount: -5000, date: "2026-02-01" }),
      payment({ amount: 0, date: "2026-03-01" }),
    ])));
    eq(back.map((p) => p.amount), [1e9, -5000, 0], "金额");
  });

  check("发放", "非法日期 2026-13-01 原样保留、不丢记录", () => {
    const back = parsePaymentSheet(buf(buildPaymentWorkbook([payment({ date: "2026-13-01" })])));
    eq([back.length, back[0].date], [1, "2026-13-01"], "非法日期");
  });
}
