/**
 * 持久化模式：undefined = 尚未确认，true = 服务器，false = 明确本地。
 *
 * 为什么单独一个文件：photos.ts（客户端照片库）等模块只需要这一个开关，
 * 原来要从整个同步引擎（nas-sync.ts）拿 —— 照片库和同步引擎因此耦合在一起。
 * 探测/推送/拉取仍在 nas-sync.ts，这里只存状态。
 */
let nas: boolean | undefined;

export function setNasEnabled(v: boolean): void {
  nas = Boolean(v);
}

export function nasEnabled(): boolean {
  // 未确认时按服务器路径处理：请求失败也不能读取旧 IndexedDB，或把上传伪装成本地成功。
  // 只有接口明确返回 persist:false 才允许进入本地模式。
  return nas !== false;
}
