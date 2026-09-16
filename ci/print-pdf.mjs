/**
 * 打印 PDF 的分页/留白测量（**纯函数，零依赖，只用 `node:zlib`**）。
 *
 * 给 `ci/mobile-print-check.mjs pages` 用：把真浏览器打印出来的 A4 PDF 拆成一页一页，
 * 用迷你内容流解释器算出：
 *   · 这一页墨迹的最低/最高点在哪 → 每页底部/顶部留白多少 mm（`pdfPageMetrics`）；
 *   · 这一页每一行印了什么字（`pdfPageTexts`，靠 PDF 自带的 /ToUnicode CMap 解码）
 *     → 用来验证「第二页顶上是不是重复了表头 / 单据名」，也就是**裁开之后每一页认不认得出**。
 * 单独成一个模块是为了能脱离浏览器单独调试：
 *   node -e "import('./ci/print-pdf.mjs').then(m=>console.log(m.pdfPageTexts(require('fs').readFileSync(p))))"
 *
 * 口径（与用户商量过的「省纸」标准一致）：
 *   · 底部留白 = 该页墨迹最低点到纸底可打印区上限（12mm 页边距）的距离；
 *   · **整页填充矩形不算墨迹**（那是页面底纹，不是内容；打印时默认也不打底色）；
 *   · 单据外框（stroke，如 `.statement` 的黑框）算墨迹 —— 它是「这张单子到哪结束」的真实边界。
 */

import { inflateSync } from "node:zlib";

const PT_PER_MM = 72 / 25.4;
const A4 = [0, 0, 595.276, 841.89];

/** 把 PDF 拆成「对象号 → 对象体文本」（对象体从 `obj` 之后到下一个对象的 `N 0 obj` 之前） */
function pdfObjects(s) {
  const hits = [];
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(s))) hits.push({ num: Number(m[1]), at: m.index, bodyStart: re.lastIndex });
  const objs = new Map();
  for (let i = 0; i < hits.length; i += 1) {
    const stop = i + 1 < hits.length ? hits[i + 1].at : s.length;
    if (!objs.has(hits[i].num)) objs.set(hits[i].num, s.slice(hits[i].bodyStart, stop));
  }
  return objs;
}

/** 取出对象里的流并解压（FlateDecode） */
function streamOf(body) {
  const idx = body.indexOf("stream");
  if (idx < 0) return null;
  let p = idx + 6;
  if (body[p] === "\r") p += 1;
  if (body[p] === "\n") p += 1;
  let e = body.lastIndexOf("endstream");
  if (e <= p) e = body.length;
  const raw = Buffer.from(body.slice(p, e), "latin1");
  if (!/\/FlateDecode/.test(body.slice(0, idx))) return raw;
  try {
    return inflateSync(raw);
  } catch {
    return null;
  }
}

/** 页对象（按 /Kids 顺序；MediaBox 缺失时从 /Pages 继承） */
function pdfPages(buf) {
  const s = buf.toString("latin1");
  const objs = pdfObjects(s);
  const pages = [];
  let inherited = null;
  for (const [num, body] of objs) {
    const head = body.slice(0, 2400);
    if (/\/Type\s*\/Pages/.test(head)) {
      const mb = /\/MediaBox\s*\[([^\]]*)\]/.exec(head);
      if (mb && !inherited) inherited = mb[1].trim().split(/\s+/).map(Number);
      continue;
    }
    if (!/\/Type\s*\/Page(?!s)/.test(head)) continue;
    const refs = [];
    const arr = /\/Contents\s*\[([^\]]*)\]/.exec(head);
    if (arr) {
      for (const r of arr[1].matchAll(/(\d+)\s+\d+\s+R/g)) refs.push(Number(r[1]));
    } else {
      const one = /\/Contents\s+(\d+)\s+\d+\s+R/.exec(head);
      if (one) refs.push(Number(one[1]));
    }
    const mb = /\/MediaBox\s*\[([^\]]*)\]/.exec(head);
    pages.push({ num, refs, box: mb ? mb[1].trim().split(/\s+/).map(Number) : inherited || A4, objs });
  }
  const order = [];
  for (const body of objs.values()) {
    const head = body.slice(0, 2400);
    if (!/\/Type\s*\/Pages/.test(head)) continue;
    const kids = /\/Kids\s*\[([^\]]*)\]/.exec(head);
    if (kids) for (const r of kids[1].matchAll(/(\d+)\s+\d+\s+R/g)) order.push(Number(r[1]));
  }
  const byNum = new Map(pages.map((pg) => [pg.num, pg]));
  const ordered = order.map((n) => byNum.get(n)).filter(Boolean);
  return ordered.length === pages.length ? ordered : pages;
}

/** 解析一段 /ToUnicode CMap：返回 { bytes: 每码字节数, map: 十六进制码 → 字符 } */
function parseCMap(text) {
  const map = new Map();
  let bytes = 2;
  const csr = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(text);
  if (csr) {
    const first = /<([0-9A-Fa-f]+)>/.exec(csr[1]);
    if (first) bytes = Math.max(1, Math.round(first[1].length / 2));
  }
  const decode = (hex) => {
    let out = "";
    for (let i = 0; i + 3 < hex.length + 1 && i + 3 <= hex.length; i += 4) {
      const code = parseInt(hex.slice(i, i + 4), 16);
      if (Number.isNaN(code)) break;
      out += code === 0 ? "" : String.fromCharCode(code);
    }
    return out;
  };
  for (const blk of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of blk[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(m[1].toUpperCase(), decode(m[2]));
    }
  }
  for (const blk of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of blk[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[0-9A-Fa-f]+>|\[[^\]]*\])/g)) {
      const lo = parseInt(m[1], 16);
      const hi = parseInt(m[2], 16);
      if (m[3].startsWith("[")) {
        const dests = [...m[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((d) => decode(d[1]));
        dests.forEach((d, i) => {
          if (lo + i <= hi) map.set((lo + i).toString(16).toUpperCase().padStart(m[1].length, "0"), d);
        });
      } else {
        const base = parseInt(m[3].slice(1, -1), 16);
        for (let c = lo; c <= hi && c - lo < 65536; c += 1) {
          map.set(c.toString(16).toUpperCase().padStart(m[1].length, "0"), String.fromCharCode(base + (c - lo)));
        }
      }
    }
  }
  return { bytes, map };
}

/** 这一页的字号表：/F1 → {bytes, map}（没有 ToUnicode 的走 latin1 兜底） */
function fontMaps(pg) {
  const out = new Map();
  const head = pg.objs.get(pg.num) || "";
  const res = /\/Font\s*<<([\s\S]*?)>>/.exec(head);
  if (!res) return out;
  for (const m of res[1].matchAll(/\/([^\s/]+)\s+(\d+)\s+\d+\s+R/g)) {
    const fontBody = pg.objs.get(Number(m[2])) || "";
    const tu = /\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(fontBody);
    const st = tu ? streamOf(pg.objs.get(Number(tu[1])) || "") : null;
    out.set(m[1], st ? parseCMap(st.toString("latin1")) : { bytes: 1, map: null });
  }
  return out;
}

/** 按码表把内容流里的字符串解成文字 */
function decodeShow(strTok, font) {
  if (strTok.startsWith("<")) {
    const hex = strTok.slice(1, -1).replace(/[^0-9A-Fa-f]/g, "");
    if (!font || !font.map) {
      return Buffer.from(hex.replace(/[^0-9A-Fa-f]/g, "").padEnd(Math.ceil(hex.length / 2) * 2, "0"), "hex").toString("latin1");
    }
    const step = font.bytes * 2;
    let text = "";
    for (let i = 0; i + step <= hex.length; i += step) {
      const code = hex.slice(i, i + step).toUpperCase();
      text += font.map.get(code.replace(/^0+(?=.)/, "")) ?? font.map.get(code) ?? "";
    }
    return text;
  }
  const body = strTok.slice(1, -1);
  return body.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, esc) => {
    if (esc === "n") return "\n";
    if (esc === "r") return "\r";
    if (esc === "t") return "\t";
    if (/^[0-7]+$/.test(esc)) return String.fromCharCode(parseInt(esc, 8));
    return esc;
  });
}

/**
 * 迷你内容流解释器。
 * 返回：这一页墨迹的最低/最高 y（PDF 坐标，pt，原点在左下）+ 每一段的文字与位置。
 */
function inkExtent(content, opts = {}) {
  const src = content.toString("latin1");
  const fonts = opts.fonts || new Map();
  const box = opts.box || A4;
  const pageH = box[3] - box[1];
  const pageW = box[2] - box[0];
  const toks = src.match(/\/[^\s/\[\]()<>]+|\[[^\]]*\]|\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]*>|[-+]?[\d.]+|[A-Za-z*'"]+/g) || [];
  // PDF 矩阵是「行向量」约定 p' = p × M；mul(m, n) = 先做 m 再做 n。
  // PDF 的 cm 是把新矩阵**左乘**到 CTM（CTM' = M × CTM），所以写法是 mul(M, ctm)。
  const mul = (m, n) => [
    m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5],
  ];
  const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const ID = [1, 0, 0, 1, 0, 0];
  const tr = (tx, ty) => [1, 0, 0, 1, tx, ty];
  const stack = [];
  const saved = [];
  let ctm = ID.slice();
  let tm = ID.slice();
  let tlm = ID.slice();
  let fs = 12;
  let leading = 0;
  let fontName = "";
  let pending = [];
  let minY = Infinity;
  let maxY = -Infinity;
  let textMinY = Infinity;
  let textMaxY = -Infinity;
  const runs = [];
  const ink = (y0, y1) => {
    minY = Math.min(minY, y0);
    maxY = Math.max(maxY, y1);
  };
  /** 落笔：矩形/折线在设备坐标里的范围（整页填充 = 底纹，不算墨迹） */
  const commit = (kind) => {
    if (!pending.length) return;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [x, y] of pending) {
      const [dx, dy] = apply(ctm, x, y);
      x0 = Math.min(x0, dx);
      x1 = Math.max(x1, dx);
      y0 = Math.min(y0, dy);
      y1 = Math.max(y1, dy);
    }
    pending = [];
    // 「整页底纹」判定放宽到 75%：打印件本身是「可打印区」大小（约 88%×92% 纸面），
    // 页面底色矩形正好落在这个区间；而表格里的行/单元格填充远小于它。
    const fullPage = x1 - x0 >= pageW * 0.75 && y1 - y0 >= pageH * 0.75;
    if (kind === "fill" && fullPage) return; // 页面底纹（浅灰背景）不是内容
    ink(y0, y1);
  };
  const showText = (strTok, arrayTok) => {
    const t = mul(tm, ctm);
    const [bx, by] = apply(t, 0, 0);
    const [, ty1] = apply(t, 0, fs);
    const h = Math.abs(ty1 - by);
    ink(Math.min(by, ty1) - h * 0.22, Math.max(by, ty1));
    textMinY = Math.min(textMinY, Math.min(by, ty1) - h * 0.22);
    textMaxY = Math.max(textMaxY, Math.max(by, ty1));
    const font = fonts.get(fontName);
    let text = "";
    if (arrayTok) {
      for (const s of arrayTok.matchAll(/<[0-9A-Fa-f\s]*>|\((?:\\[\s\S]|[^\\()])*\)/g)) text += decodeShow(s[0], font);
    } else if (strTok) {
      text += decodeShow(strTok, font);
    }
    if (text.trim()) runs.push({ x: bx, y: by, size: fs, text });
  };
  const nums = (n) => stack.slice(-n).map((v) => (typeof v === "number" ? v : 0));
  for (const tok of toks) {
    if (/^[-+]?[\d.]+$/.test(tok)) {
      stack.push(Number(tok));
      continue;
    }
    if (tok.startsWith("/")) {
      stack.push({ name: tok.slice(1) });
      continue;
    }
    if (tok.startsWith("[")) {
      stack.push({ array: tok });
      continue;
    }
    if (tok.startsWith("(") || tok.startsWith("<")) {
      stack.push({ str: tok });
      continue;
    }
    switch (tok) {
      case "q":
        saved.push({ ctm: ctm.slice(), fs, leading, fontName });
        break;
      case "Q": {
        const st = saved.pop();
        if (st) {
          ctm = st.ctm;
          fs = st.fs;
          leading = st.leading;
          fontName = st.fontName;
        }
        break;
      }
      case "cm": {
        const [a, b, c, d, e, f] = nums(6);
        ctm = mul([a, b, c, d, e, f], ctm);
        break;
      }
      case "BT":
        tm = ID.slice();
        tlm = ID.slice();
        break;
      case "Tf": {
        const last = stack[stack.length - 1];
        const nameTok = stack[stack.length - 2];
        fs = typeof last === "number" ? last : 0;
        fontName = nameTok && nameTok.name ? nameTok.name : "";
        break;
      }
      case "TL":
        leading = Number(stack[stack.length - 1]) || 0;
        break;
      case "Td": {
        const [tx, ty] = nums(2);
        tlm = mul(tr(tx, ty), tlm);
        tm = tlm.slice();
        break;
      }
      case "TD": {
        const [tx, ty] = nums(2);
        leading = -ty;
        tlm = mul(tr(tx, ty), tlm);
        tm = tlm.slice();
        break;
      }
      case "Tm": {
        const m = nums(6);
        tm = m.slice();
        tlm = m.slice();
        break;
      }
      case "T*":
        tlm = mul(tr(0, -leading), tlm);
        tm = tlm.slice();
        break;
      case "Tj":
      case "TJ":
      case "'":
      case '"': {
        if (tok === "'" || tok === '"') {
          tlm = mul(tr(0, -leading), tlm);
          tm = tlm.slice();
        }
        const arr = [...stack].reverse().find((v) => v && v.array);
        const str = [...stack].reverse().find((v) => v && v.str);
        if (tok === "TJ" && arr) showText(null, arr.array);
        else if (str) showText(str.str, null);
        break;
      }
      case "re": {
        const [x, y, w, h] = nums(4);
        pending.push([x, y], [x + w, y], [x, y + h], [x + w, y + h]);
        break;
      }
      case "m":
      case "l": {
        const [x, y] = nums(2);
        pending.push([x, y]);
        break;
      }
      case "c": {
        const p = nums(6);
        pending.push([p[0], p[1]], [p[2], p[3]], [p[4], p[5]]);
        break;
      }
      case "v":
      case "y": {
        const p = nums(4);
        pending.push([p[0], p[1]], [p[2], p[3]]);
        break;
      }
      case "f":
      case "F":
      case "f*":
        commit("fill");
        break;
      case "B":
      case "B*":
      case "b":
      case "b*":
        commit("both");
        break;
      case "S":
      case "s":
        commit("stroke");
        break;
      case "sh":
        pending = [];
        break;
      case "n":
      case "W":
      case "W*":
        pending = [];
        break;
      default:
        break;
    }
    if (tok.length <= 3) stack.length = 0;
  }
  return { minY, maxY, textMinY, textMaxY, runs };
}

/** 每一页的墨迹范围 + 文字行（按 y 从高到低、同一条线上从左到右） */
function pdfPageTexts(buf) {
  const margin = 12 * PT_PER_MM;
  return pdfPages(buf).map((pg, i) => {
    const height = pg.box[3] - pg.box[1];
    const fonts = fontMaps(pg);
    let minY = Infinity;
    let maxY = -Infinity;
    let textMinY = Infinity;
    let textMaxY = -Infinity;
    const runs = [];
    for (const ref of pg.refs) {
      const body = pg.objs.get(ref);
      if (!body) continue;
      const stream = streamOf(body);
      if (!stream) continue;
      const e = inkExtent(stream, { fonts, box: pg.box });
      minY = Math.min(minY, e.minY);
      maxY = Math.max(maxY, e.maxY);
      textMinY = Math.min(textMinY, e.textMinY);
      textMaxY = Math.max(textMaxY, e.textMaxY);
      runs.push(...e.runs);
    }
    const lines = [];
    for (const r of runs.sort((a, b) => b.y - a.y || a.x - b.x)) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - r.y) < 4) {
        last.text += (last.text.endsWith(" ") || r.text.startsWith(" ") ? "" : " ") + r.text;
      } else {
        lines.push({ y: r.y, text: r.text });
      }
    }
    const blank = minY === Infinity;
    return {
      page: i + 1,
      heightMm: Number((height / PT_PER_MM).toFixed(1)),
      blank,
      blankBottomMm: Number(((blank ? height - 2 * margin : minY - margin) / PT_PER_MM).toFixed(1)),
      blankTopMm: Number(((blank ? height - 2 * margin : height - margin - maxY) / PT_PER_MM).toFixed(1)),
      // 只算文字（不含单据外框/表格线）：报「这一页的内容印到哪儿为止」用这个更稳
      textBottomMm: Number(((textMinY === Infinity ? height - 2 * margin : textMinY - margin) / PT_PER_MM).toFixed(1)),
      textTopMm: Number(((textMaxY === -Infinity ? height - 2 * margin : height - margin - textMaxY) / PT_PER_MM).toFixed(1)),
      lines: lines.map((l) => ({ y: Number(l.y.toFixed(1)), text: l.text.replace(/\s+/g, " ").trim() })).filter((l) => l.text),
    };
  });
}

/** 只要留白数字（沿用 1.8.10 起 `pages` 子命令的输出形状） */
function pdfPageMetrics(buf) {
  return pdfPageTexts(buf).map(({ page, heightMm, blank, blankBottomMm, blankTopMm }) => ({
    page,
    heightMm,
    blank,
    blankBottomMm,
    blankTopMm,
  }));
}

export { pdfObjects, streamOf, pdfPages, inkExtent, pdfPageTexts, pdfPageMetrics };
