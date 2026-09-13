/**
 * 一键更新模块的组合出口（barrel）。
 * 实现已拆到 ./update/ 下：consts（常量）/ log（更新日志与容器现场）/
 * version（版本检查与拉取候选）/ docker（引擎交互与镜像清理）/
 * updater-script（内联替换脚本）/ apply（执行与后台任务）。
 * 这里只按原 update.server.ts 的公开 API 做转发，导入方路径不变。
 */
export { appendUpdateLog, readUpdateLog } from "./update/log";
export { isPortable, hasDockerSock, parseImageVersion, buildImageCandidates, checkUpdate } from "./update/version";
export type { UpdateInfo } from "./update/version";
export {
  dockerMessage,
  sameImageId,
  pickRemovableImages,
  usedImageIdsOf,
  staleHelperContainer,
  listLocalImages,
  pruneLocalImages,
} from "./update/docker";
export type { LocalImage } from "./update/docker";
export { UPDATER_SCRIPT } from "./update/updater-script";
export { applyUpdate, checkSameOrigin, updateJobStatus, startUpdateJob } from "./update/apply";
export type { UpdateJobState } from "./update/apply";
