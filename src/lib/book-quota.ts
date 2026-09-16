/**
 * 普通成员自建台账的**数量上限**（1.8.9，CTO 拍板口径）。
 *
 * 背景（A 组逐项测试报告第 22 项，1.8.9 复现）：`POST /api/auth` 的 `op=createBook`
 * 原来**无任何门禁** —— 只有 `*.view` 的只读账号也能无限创建台账，且自建台账里
 * 他自己是 owner、拿 `*`（等于绕过预设权限又开了一套「自己的」数据空间）。
 *
 * 拍板结果：**允许成员自建**（成员需要一个属于自己的数据空间，也看不到别人的数据），
 * 但**限制数量** —— 普通成员最多 5 本「自己作为 owner」的台账；
 * 管理员/超管不受限；`MAX_OWNED_BOOKS` 环境变量可覆盖默认值。
 *
 * 两个口径必须钉死（都写进了 tests/book-quota.test.ts）：
 *  ① **只统计 owner**：被管理员加为成员的台账不算他自己创建的；
 *  ② 超限**不创建**，返回 400 + 下面这句可读提示（前端原样显示）。
 *
 * 本模块是纯函数（不碰文件系统），既能被服务端门禁用，也能被前端/测试直接引。
 */

/** 默认上限：普通成员最多 5 本自建台账 */
export const DEFAULT_MAX_OWNED_BOOKS = 5;

/**
 * 生效上限：`MAX_OWNED_BOOKS` 覆盖默认值。
 * 非法值（空 / 0 / 负数 / 非数字）一律回落默认 5；上限兜底 1000（防止误设成天文数字导致越界比较）。
 */
export function maxOwnedBooks(env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {}): number {
  const raw = Number(env?.MAX_OWNED_BOOKS);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_MAX_OWNED_BOOKS;
  return Math.min(Math.floor(raw), 1000);
}

/** 某人是「创建人（owner）」的台账数。被加为成员的台账不计入。 */
export function ownedBookCount(books: { ownerId?: string }[], userId: string): number {
  return books.filter((b) => Boolean(userId) && b.ownerId === userId).length;
}

/** 超限时返回给前端的唯一文案（前端原样显示，不再自己拼一份） */
export function ownedBooksLimitMessage(limit: number): string {
  return `你已创建 ${limit} 套台账，已达上限；需要更多请联系管理员。`;
}
