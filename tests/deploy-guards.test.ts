/**
 * 交付链路约定守卫（A8 / B5 / B6，2026-09-17 专家评审）—— 全部是「本地能改」的部分，
 * 改 workflow 本身必须走 GitHub 网页，所以这里守的是 `ci/` 下的模板与脚本。
 *
 * 为什么用源码守卫而不是单测：这些都是「配置/脚本里的一个字符」级别的约定，
 * 单元测试测不到、构建也不报错，只有真正发出去（或真机跑一次）才发现：
 *
 *   B5 · `Dockerfile` 的 CMD 如果是 `sh -c "… && node …"`，PID 1 就是 **sh**：
 *        `docker stop` 的 SIGTERM 停在 sh 上（sh 秒退），node 直接吃 SIGKILL ——
 *        在飞的整本快照保存被硬中断、也没有收尾日志。修法是一个 `exec`。
 *   B6 · `win/启动.bat` 里那句固定的 `cd /d "%~dp0.."` 是给 `win/` 子目录写的，
 *        而 `win/pack.sh` 把同一个文件也放到 zip 根目录；在线更新后启动的正是**根目录那份**
 *        （`src/lib/update/apply.ts` 的 `start "" "%~dp0启动.bat"`）→ 会切到安装根上一层、
 *        报「请重新解压」，更新后服务不回来。修法：脚本自适应层次。
 *   A8 · `ci/check.workflow.yml` 的第四道闸必须是硬失败的指纹校验（不能被改回 warning），
 *        `ci/docker.workflow.yml` 的两个 job 必须在构建/打包前自己从源码构建。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

test("Dockerfile：PID 1 必须是 node（exec），否则 docker stop 的 SIGTERM 到不了应用（B5）", () => {
  const dockerfile = read("Dockerfile");
  const cmdLine = dockerfile.split("\n").find((l) => l.startsWith("CMD ")) || "";
  assert.match(cmdLine, /\bexec node app\/server\/index\.mjs\b/, `CMD 必须用 exec 让 node 接管 PID 1：${cmdLine}`);
  assert.equal(
    /&&\s*node app\/server\/index\.mjs\b/.test(cmdLine),
    false,
    "不能是 `&& node …`（那样 PID 1 是 sh，信号到不了 node）",
  );
});

test("Dockerfile：要有 HEALTHCHECK 指向 /api/health（一键更新的就绪校验靠它，B4）", () => {
  const dockerfile = read("Dockerfile");
  assert.match(dockerfile, /^HEALTHCHECK /m, "没有健康检查时「新容器起没起来」只能靠时间猜");
  assert.match(dockerfile, /\/api\/health/, "探的必须是免登录的 /api/health");
  assert.match(dockerfile, /process\.env\.PORT/, "端口要跟着 PORT/NITRO_PORT 走，用户改端口也能探到");
});

test("Windows 启动器：目录层次自适应，zip 根目录那份也必须能起来（B6）", () => {
  for (const name of ["win/启动.bat", "win/停止.bat"]) {
    const bat = read(name);
    assert.match(
      bat,
      /if exist "%~dp0app\\server\\index\.mjs"/,
      `${name} 必须先判断「%~dp0 自己是不是程序根目录」再决定要不要上跳一级`,
    );
    const cds = bat.split("\n").filter((l) => /^\s*cd \/d "%~dp0\.\."\s*$/i.test(l));
    assert.equal(cds.length <= 1, true, `${name} 里 cd /d "%~dp0.." 只能出现在 else 分支里`);
    assert.equal(
      bat.indexOf('cd /d "%~dp0"') > 0 && bat.indexOf('cd /d "%~dp0"') < bat.indexOf('cd /d "%~dp0.."'),
      true,
      `${name} 必须先试「自己就是根目录」，再退回上一级`,
    );
  }
});

test("Windows 包：pack.sh 仍把 bat 放两份（根 + win/），并写清根目录就是安装根（B6）", () => {
  const pack = read("win/pack.sh");
  assert.match(pack, /cp win\/启动\.bat win\/停止\.bat "\$STAGE\/win\/"/);
  assert.match(pack, /cp win\/启动\.bat win\/停止\.bat "\$STAGE\/"/, "在线更新脚本只在解压根目录找 bat");
  assert.match(pack, /安装根/, "要在打包脚本里写清 zip 根 = 安装根（否则下次又会有人按「bat 在 win/ 下」改回去）");
});

test("在线更新后启动的正是 zip 根那份 bat：apply.ts 与 pack.sh 的口径必须对得上（B6）", () => {
  const apply = read("src/lib/update/apply.ts");
  assert.match(apply, /start "" "%~dp0启动\.bat"/, "更新结束用 %~dp0启动.bat（安装根那份）拉起服务");
  assert.match(
    apply,
    /copy \/Y "%SRC%[\\]+启动\.bat" "启动\.bat"/,
    "更新包里的启动器会被覆盖到安装根 —— 所以根目录那份必须自适应层次",
  );
});

test("ci/check.workflow.yml：第四道闸是硬失败（cmp + 指纹），不再只给 warning（A8）", () => {
  const yml = read("ci/check.workflow.yml");
  assert.match(yml, /cmp scripts\/app-server-index\.mjs app\/server\/index\.mjs/, "逐字节比对启动器");
  assert.match(yml, /cmp scripts\/log-core\.mjs app\/server\/log-core\.mjs/, "逐字节比对日志核心");
  assert.match(yml, /cmp VERSION\.txt app\/VERSION\.txt/);
  assert.match(yml, /node scripts\/build-stamp\.mjs --verify/, "必须比源码指纹（跨环境稳定，能当硬失败）");
  assert.match(yml, /pnpm run build/, "仍然要构建一次，确认源码真的能构建出产物");
  const gate = yml.slice(yml.indexOf("构建产物不漂移"));
  assert.equal(gate.includes("::warning::app/ 与源码"), false, "漂移不能只是 warning（那正是原来的问题）");
  assert.match(yml, /node-version: 24/, "与开发者本机一致（类型擦除需要 ≥22.18）");
});

test("ci/docker.workflow.yml：镜像与 Windows 包都必须先自己构建，不信任仓库里的 app/（A8）", () => {
  const yml = read("ci/docker.workflow.yml");
  const buildAt = yml.indexOf("run: pnpm run build");
  const dockerBuildAt = yml.indexOf("docker/build-push-action@v6");
  const packAt = yml.indexOf("bash win/pack.sh");
  assert.equal(buildAt > 0, true, "至少要构建一次");
  assert.equal(dockerBuildAt > buildAt, true, "docker build 之前必须先从源码构建（Dockerfile 只 COPY app）");
  assert.equal(packAt > 0, true, "Windows 包仍由 win/pack.sh 打");
  assert.equal(
    yml.lastIndexOf("run: pnpm run build") < packAt,
    true,
    "打包 zip 之前也必须从源码构建（pack.sh 拷的就是 app/）",
  );
  assert.equal(yml.includes("pnpm install --frozen-lockfile"), true, "构建前要按 lockfile 装依赖");
});

test("ci/README.md：写清这两个 workflow 只能在 GitHub 网页粘贴（本地改会被拒推）", () => {
  const md = read("ci/README.md");
  assert.match(md, /ci\/check\.workflow\.yml/, "要指向 check 模板");
  assert.match(md, /ci\/docker\.workflow\.yml/, "要指向 docker 模板");
  assert.match(md, /Edit workflow/, "要写清具体点哪里");
  assert.match(md, /app\/\.build-inputs/, "要提醒指纹文件跟 app/ 一起提交");
});
