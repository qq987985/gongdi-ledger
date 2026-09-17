/**
 * 备份内容校验（专家评审 B-12③，1.8.14）。
 *
 * 1.8.4 只挡了「0 字节」：一次失败的请求会把「最新备份」（固定名 `backups/考勤表.xlsx`）
 * 清成 0 字节。但**非空垃圾**同样会毁掉最新备份 —— 一段 JSON、一个 HTML 错误页、
 * 被截断的 xlsx，都会原样覆盖固定名那份，而接口还回 `{ok:true}`。
 *
 * 这里给出纯函数的判据（不引依赖、不解析整份工作簿）：
 *  ① 空 body → 拒（文案与 1.8.4 完全一致，老测试断言 /空|0 字节/ 仍然匹配）；
 *  ② 不是 ZIP（xlsx = zip）→ 拒：文件头不是 `PK\x03\x04`；
 *  ③ 是 zip 但没有 `xl/` 目录（比如把一张图片改了后缀）→ 拒；
 *  ④ 有 `xl/` 但缺少 zip 的结尾中央目录（`PK\x05\x06`）→ 拒（= 被截断/传输中断的 xlsx）。
 * 为什么不直接 `XLSX.read()`：那是把 50MB 上限内的内容整份解压解析（CPU / 内存放大），
 * 而这里要挡的是「明显不是 xlsx」这一类；结构检查已足够，且与 1.8.4 的「写盘前拒掉」同一时机。
 */

/** 返回空串 = 可以当备份写；否则返回给用户看的原因（接口原文返回） */
export function backupRejectReason(buf: Uint8Array | Buffer | null | undefined): string {
  const n = buf ? buf.length : 0;
  if (!n) return "备份内容为空（0 字节）";
  if (!hasPrefix(buf!, [0x50, 0x4b, 0x03, 0x04]) && !hasPrefix(buf!, [0x50, 0x4b, 0x05, 0x06])) {
    return "备份内容不是 xlsx 文件（没有 xlsx/zip 文件头），已拒绝写入";
  }
  if (!hasBytes(buf!, "xl/")) return "备份内容不是 xlsx 文件（缺少 xl/ 工作簿目录），已拒绝写入";
  if (!hasBytes(buf!, [0x50, 0x4b, 0x05, 0x06]))
    return "备份内容像是被截断或损坏的 xlsx（缺少 zip 结尾目录），已拒绝写入";
  return "";
}

function hasPrefix(buf: Uint8Array, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) if (buf[i] !== bytes[i]) return false;
  return true;
}

/** 在字节流里找一段 ASCII（zip 的中央目录里条目名是明文，够用来判断「是不是 xlsx」） */
function hasBytes(buf: Uint8Array, needle: string | number[]): boolean {
  const n = typeof needle === "string" ? [...needle].map((c) => c.charCodeAt(0)) : needle;
  if (!n.length || buf.length < n.length) return false;
  const first = n[0];
  for (let i = 0; i <= buf.length - n.length; i++) {
    if (buf[i] !== first) continue;
    let ok = true;
    for (let j = 1; j < n.length; j++) {
      if (buf[i + j] !== n[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}
