export type PreviewKind = "image" | "pdf" | "other";

/** 响应有 MIME 时必须以真实类型为准，不能用台账显示名把 XML 伪装成 PDF。 */
export function previewKindOf(name: string, mime = ""): PreviewKind {
  const type = mime.split(";")[0].trim().toLowerCase();
  if (type) {
    if (["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"].includes(type)) return "image";
    return type === "application/pdf" ? "pdf" : "other";
  }
  // 无 MIME 只兼容图片：img 不执行文档脚本；PDF 必须有明确 MIME，避免 iframe 嗅探活动内容。
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(ext)) return "image";
  return "other";
}
