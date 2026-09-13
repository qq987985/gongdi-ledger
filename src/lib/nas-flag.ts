/**
 * 「服务器是否开了 NAS 持久化」这一个布尔状态。
 *
 * 为什么单独一个文件：photos.ts（客户端照片库）等模块只需要这一个开关，
 * 原来要从整个同步引擎（nas-sync.ts）拿 —— 照片库和同步引擎因此耦合在一起。
 * 探测/推送/拉取仍在 nas-sync.ts，这里只存状态。
 */
let nas = false;

export function setNasEnabled(v: boolean): void {
  nas = Boolean(v);
}

export function nasEnabled(): boolean {
  return nas;
}
