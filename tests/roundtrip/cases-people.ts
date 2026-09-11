import * as XLSX from "xlsx";
import { buildPeopleWorkbook, parsePeopleSheet } from "../../src/lib/excel";
import { check, eq, okv } from "./harness";
import { buf, handWb, person } from "./fixtures";

const PEOPLE_HEAD = [
  "姓名", "班组", "IC卡号", "联系电话", "计薪方式", "日工资", "月工资", "加班规则", "餐补/天",
  "性别", "生日", "身份证号", "身份证签发机关", "身份证有效期开始", "身份证有效期结束",
  "开户行", "银行卡号", "户籍地址", "备注",
];

function parseOne(rows: unknown[][]) {
  return parsePeopleSheet(buf(handWb("人员信息", [PEOPLE_HEAD, ...rows])));
}

export function runPeople() {
  check("人员", "导出→导入逐字段核对（姓名/班组/IC卡号/电话/计薪/日薪/月薪/加班/餐补/性别/生日/身份证/签发机关/有效期/开户行/卡号/户籍/备注）", () => {
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([person()])))[0];
    const got = {
      name: back.name, team: back.team, personNo: back.personNo, phone: back.phone,
      payType: back.payType, dailyWage: back.dailyWage, monthWage: back.monthWage,
      otRule: back.otRule, mealAllowance: back.mealAllowance, gender: back.gender,
      birthday: back.birthday, idCard: back.idCard, idIssuer: back.idIssuer,
      idValidFrom: back.idValidFrom, idValidTo: back.idValidTo, bank: back.bank,
      cardNo: back.cardNo, address: back.address, remark: back.remark,
    };
    eq(got, {
      name: "张三", team: "一班", personNo: "DEMO001", phone: "13900000000",
      payType: "day", dailyWage: 300, monthWage: 0, otRule: "按小时:25", mealAllowance: 12,
      gender: "男", birthday: "1990-01-01", idCard: "110101199001011210",
      idIssuer: "北京市公安局东城分局", idValidFrom: "2020-01-01", idValidTo: "2040-01-01",
      bank: "中国工商银行北京分行", cardNo: "6222021234567890123",
      address: "北京市东城区示例路1号", remark: "备注甲",
    }, "人员字段");
  });

  check("人员", "调薪历史 wageHistory 导出→导入无损（id/生效日/计薪/日薪/月薪/加班/餐补/备注）", () => {
    const p = person({
      wageHistory: [
        { id: "w1", fromDate: "2025-01-01", payType: "day", dailyWage: 260, monthWage: 0, otRule: "", mealAllowance: 10, remark: "老价钱" },
        { id: "w2", fromDate: "2026-03-01", payType: "month", dailyWage: 0, monthWage: 8000, otRule: "按小时:25", mealAllowance: 0, remark: "转月薪" },
      ],
    });
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([p])))[0];
    eq(back.wageHistory, p.wageHistory, "工资历史");
  });

  check("人员", "计薪方式「按月」+ 月工资往返", () => {
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([person({ payType: "month", monthWage: 8000, dailyWage: 0 })])))[0];
    eq([back.payType, back.monthWage], ["month", 8000], "月薪");
  });

  check("人员", "身份证有效期「长期」往返", () => {
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([person({ idValidTo: "长期" })])))[0];
    eq(back.idValidTo, "长期");
  });

  check("人员", "手填「-」「空」不炸、不丢人", () => {
    const rows = parseOne([
      ["王五", "一班", "", "", "按工天", "-", "-", "", "-", "", "", "", "", "", "", "", "", "", ""],
      ["赵六", "二班", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ]);
    eq(rows.map((r) => r.name), ["王五", "赵六"], "人名");
    eq(rows.map((r) => r.dailyWage), [0, 0], "日工资");
  });

  check("人员", "超长文本（300 字备注 / 超长姓名）+ 中文括号不丢", () => {
    const long = "备注".repeat(150);
    const p = person({ name: "张三（大工）", remark: long });
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([p])))[0];
    eq(back.name, "张三（大工）", "中文括号姓名");
    eq(back.remark.length, 300, "超长备注长度");
  });

  check("人员", "姓名含 emoji 往返", () => {
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([person({ name: "张三😀" })])))[0];
    eq(back.name, "张三😀");
  });

  check("人员", "姓名含空格往返（内部空格保留、两侧空格去掉后不丢人）", () => {
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([person({ name: "张 三" }), person({ name: "  李四  ", personNo: "D2" })])));
    eq(back.map((r) => r.name), ["张 三", "李四"], "姓名");
  });

  check("人员", "10 个人导出→导入人数不丢", () => {
    const ps = Array.from({ length: 10 }, (_, i) => person({ name: `工人${i}`, personNo: `D${i}` }));
    eq(parsePeopleSheet(buf(buildPeopleWorkbook(ps))).length, 10, "人数");
  });

  check("人员", "「合计」行不被当成一个人员", () => {
    const rows = parseOne([["合计", "", "", "", "", "3000", "", "", "", "", "", "", "", "", "", "", "", "", ""]]);
    eq(rows.length, 0, "人员数");
  });
}
