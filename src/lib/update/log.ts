/**
 * 更新日志落盘（update.log / 错误文件）与更新容器现场读取。从 update.server.ts 原样搬出，行为不变。
 *
 * **互引例外（开发规范 §12.3，必须在注释里写明原因）**：本文件要 `./docker` 的 `dockerReq()`（读更新容器日志），`./docker` 又要本文件的 `appendUpdateLog()`（记更新结果）——
 * 两者互相 import。为什么允许：两者同属 `src/lib/update/` 这一条「一键更新」链路，都不是可复用的一般设施；
 * 再拆一个模块只会让 Docker 请求的签名在三个文件之间转手，真实耦合一点没少（拆的收益是零，代价是多一层跳转）。
 * 要真消除，得把「Docker 请求」（基础设施）与「更新日志文件格式」（观测）当成两个独立关注点 —— 属后续专轮。
 * 例外登记在 `tests/structure-guards.test.ts` 的白名单里，并且**本段说明必须存在**（删掉就测试红）。
 */
import { dataDir } from "../paths.server";
import { join } from "node:path";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { HELPER_NAME } from "./consts";
import { dockerReq } from "./docker";

let updateLogQueue: Promise<void> = Promise.resolve();

/**
 * 追加一行到 `data/logs/update.log`（和更新容器写的是同一个文件）。
 *
 * 为什么单独记一份：更新失败后旧容器还活着，但一旦重启，内存里的更新状态就没了，
 * 只有落盘能回答「上次更新到底怎么了」。界面上的「查看更新日志」读的就是这个文件。
 * 自身失败绝不抛出：日志不能反过来把更新搞砸。
 */
export function appendUpdateLog(text: string): Promise<void> {
  const root = dataDir();
  if (!root) return Promise.resolve();
  const line = `${new Date().toISOString()} ${text}\n`;
  updateLogQueue = updateLogQueue.then(
    async () => {
      try {
        await mkdir(join(root, "logs"), { recursive: true });
        await appendFile(join(root, "logs", "update.log"), line, "utf8");
      } catch {
        /* 写不进去就放弃 */
      }
    },
    () => {},
  );
  return updateLogQueue;
}

const LOG_TAIL_LINES = 120;
const LOG_TAIL_BYTES = 64 * 1024;

/** 取文件尾部若干行；文件不存在返回空串（正常情况），其它错误原样带出便于排查 */
async function tailFile(path: string): Promise<string> {
  try {
    const raw = await readFile(path, "utf8");
    let text = raw;
    if (raw.length > LOG_TAIL_BYTES) {
      const cut = raw.slice(-LOG_TAIL_BYTES);
      const nl = cut.indexOf("\n");
      text = nl >= 0 ? cut.slice(nl + 1) : cut; // 丢掉被截断的半行
    }
    const lines = text.trimEnd().split("\n");
    return lines.slice(Math.max(0, lines.length - LOG_TAIL_LINES)).join("\n");
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return "";
    return `[读取失败] ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * 读回更新现场：`data/logs/update.log`（应用 + 更新容器都写这个文件）与
 * `data/.gongdi-update-error.txt`（更新容器失败时写的最后一份错误）。
 * 供界面上的「查看更新日志」使用，只读、不抛。
 */
export async function readUpdateLog(): Promise<{ log: string; errorText: string; note: string; helper: string }> {
  const root = dataDir();
  if (!root) return { log: "", errorText: "", note: "未开启 NAS 持久化，本机运行没有更新日志", helper: "" };
  const [log, errorText, helper] = await Promise.all([
    tailFile(join(root, "logs", "update.log")),
    tailFile(join(root, ".gondi-update-error.txt")),
    helperReport(),
  ]);
  return {
    log,
    errorText,
    helper,
    note: log || errorText || helper ? "" : "还没有更新记录（data/logs/update.log 不存在）",
  };
}

/**
 * 更新容器（gongdi-updater）自己的状态与日志。
 *
 * 为什么要看它：换容器是它干的，应用侧只看到「已启动更新容器」。它一声不响地退出
 * （脚本语法错误、挂载不对、镜像有问题）时，界面以前完全看不出来。现在更新容器不再
 * 自动删除（AutoRemove:false），所以随时能读到它的 docker logs。
 */
async function helperReport(): Promise<string> {
  try {
    const j = await dockerReq("GET", `/containers/${HELPER_NAME}/json`);
    const st = (j?.State || {}) as { Running?: boolean; ExitCode?: number; StartedAt?: string; FinishedAt?: string };
    const when = (t?: string) => (t && !t.startsWith("0001") ? String(t).slice(11, 19) : "");
    const head = st.Running
      ? `更新容器：正在运行（${when(st.StartedAt)} 启动）`
      : `更新容器：已退出（exit ${st.ExitCode ?? "?"}${when(st.FinishedAt) ? `，${when(st.FinishedAt)}` : ""}）`;
    const logs = await readContainerLogs(HELPER_NAME, 80);
    return `${head}\n${logs || "（更新容器没有任何输出）"}`;
  } catch {
    return ""; // 没挂 docker.sock / 还没跑过更新
  }
}

/** 读某个容器的 stdout+stderr；未开 TTY 时日志带二进制帧头，清掉再给人看 */
export async function readContainerLogs(id: string, tail = 120): Promise<string> {
  const r = await dockerReq("GET", `/containers/${encodeURIComponent(id)}/logs?stdout=1&stderr=1&tail=${tail}`);
  const raw = typeof r === "string" ? r : String((r as { raw?: string })?.raw || "");
  return raw
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\r\n/g, "\n")
    .trimEnd();
}
