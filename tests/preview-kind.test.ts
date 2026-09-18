import { test } from "node:test";
import assert from "node:assert/strict";
import { previewKindOf } from "../src/lib/preview-kind";

test("真实 MIME 优先：伪装 PDF/图片的 XML、HTML、SVG 不能内联预览", () => {
  for (const mime of ["application/xml", "text/xml", "text/html", "image/svg+xml", "application/octet-stream"]) {
    for (const name of ["合同.pdf", "照片.png"]) assert.equal(previewKindOf(name, mime), "other");
  }
});

test("合法 MIME 支持 PDF 与普通图片，类型参数/大小写不影响", () => {
  assert.equal(previewKindOf("错误名字.xml", "APPLICATION/PDF; charset=binary"), "pdf");
  assert.equal(previewKindOf("图片", "image/png"), "image");
  assert.equal(previewKindOf("图片", "image/jpeg"), "image");
});

test("MIME 缺失仅兼容图片扩展名，PDF 必须下载", () => {
  assert.equal(previewKindOf("合同.PDF"), "other");
  assert.equal(previewKindOf("图片.PNG", ""), "image");
  assert.equal(previewKindOf("发票.xml"), "other");
});
