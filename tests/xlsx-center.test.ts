import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { writeCenteredXlsx } from "../src/lib/xlsx-center";

function wbWith(titleRow: (string | number)[][], dataRows: (string | number)[][]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...titleRow, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return wb;
}

test("writeCenteredXlsx：单行标题按表宽合并并居中加粗", async () => {
  const wb = wbWith([["工资表"]], [
    ["姓名", "金额"],
    ["张三", 100],
  ]);
  const buf = await writeCenteredXlsx(wb);
  assert.ok(buf.byteLength > 500, "应产出有效 xlsx 字节");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const ws = book.worksheets[0];
  assert.equal(ws.model.merges.length, 1, "标题应跨 2 列合并");
  const cell = ws.getCell(1, 1);
  assert.equal(cell.alignment.horizontal, "center");
  assert.equal(cell.font.bold, true);
  assert.equal(String(cell.value), "工资表");
});

test("writeCenteredXlsx：多格标题行不合并，只设对齐", async () => {
  const wb = wbWith([["工 资 表", "2026年"]], [["张三", 100]]);
  const buf = await writeCenteredXlsx(wb);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const ws = book.worksheets[0];
  assert.equal(ws.model.merges.length, 0, "多格标题行不允许合并");
  assert.equal(ws.getCell(1, 1).alignment.horizontal, "center");
});

test("writeCenteredXlsx：导出→再读回，数据格内容不变", async () => {
  const wb = wbWith([["报销表"]], [
    ["项目", "金额"],
    ["吊车台班", 1200.5],
  ]);
  const buf = await writeCenteredXlsx(wb);
  const reread = XLSX.read(buf, { type: "array" });
  const rows = XLSX.utils.sheet_to_json(reread.Sheets["Sheet1"], { header: 1 }) as any[][];
  assert.equal(rows[1][0], "项目");
  assert.equal(Number(rows[2][1]), 1200.5);
});
