/**
 * 更新容器里内联执行的替换脚本（Cmd: ["node","-e",UPDATER_SCRIPT]）。
 * 从 update.server.ts 原样搬出；1.8.14 起加了「新容器就绪校验」（见脚本第 4 步）。
 * tests/update-script.test.ts 会真解析它，改脚本必须过那几条。
 */

export const UPDATER_SCRIPT = `const http=require("node:http");
const fs=require("node:fs");
const nodePath=require("node:path");
const DATA_DIR=process.env.DATA_DIR||"/data";
// 进展既写 stdout（docker logs gongdi-updater 能看到），也追加到 data/logs/update.log。
// 教训（1.7.10）：这段脚本以前是**语法错误**的 —— 模板字符串里的 \\n 变成了真换行，
// 生成的 .cjs 里字符串字面量跨行，node 直接 SyntaxError 退出，容器又被 AutoRemove 删掉，
// 于是「更新已受理」之后再无任何痕迹、容器也没换。第一步就先落一行「我起来了」。
function log(msg){
  const line=new Date().toISOString()+" "+msg;
  try{console.log(line)}catch(e){}
  try{fs.mkdirSync(nodePath.join(DATA_DIR,"logs"),{recursive:true})}catch(e){}
  try{fs.appendFileSync(nodePath.join(DATA_DIR,"logs","update.log"),line+"\\n")}catch(e){}
}
function fail(msg){
  log("更新失败: "+msg);
  try{fs.writeFileSync(nodePath.join(DATA_DIR,".gondi-update-error.txt"),new Date().toISOString()+"\\n"+msg+"\\n")}catch(e){}
}
function docker(method,apiPath,body){
  return new Promise((resolve,reject)=>{
    let data=body==null?null:typeof body==="string"?body:JSON.stringify(body);
    if(data==null&&method==="POST")data="{}";
    const req=http.request({socketPath:"/var/run/docker.sock",path:apiPath,method,headers:data?{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)}:{}},res=>{
      const chunks=[];
      res.on("data",c=>chunks.push(c));
      res.on("end",()=>{
        const raw=Buffer.concat(chunks).toString("utf8");
        if(res.statusCode>=300) return reject(new Error(raw.slice(0,400)||String(res.statusCode)));
        if(!raw) return resolve({});
        try{resolve(JSON.parse(raw))}catch{resolve({raw})}
      });
    });
    req.on("error",reject);
    if(data) req.write(data);
    req.end();
  });
}
// 就绪校验的等待窗口（秒）：最多等 READY_SECONDS，其中「没有健康检查的镜像」要连续 Running 满
// STABLE_SECONDS 秒才算就绪（拿不到健康检查时，这是唯一能证明「不是起来就退」的信号）。
const READY_SECONDS=30;
const STABLE_SECONDS=8;
// 等新容器**真的在服务**："start" 返回 200 只说明进程被拉起来了。
//   - Running===false / Restarting → 立刻判失败（带退出码，写进 update.log）
//   - 有健康检查（Dockerfile 的 HEALTHCHECK，新镜像都有）→ 以 healthy/unhealthy 为准
//   - 没有健康检查（更早的镜像）→ 连续 Running 满 STABLE_SECONDS 秒算就绪
async function waitReady(id,seconds,stableSeconds){
  const deadline=Date.now()+seconds*1000;
  const stableAt=Date.now()+stableSeconds*1000;
  let last="等待中";
  while(Date.now()<deadline){
    let st=null;
    try{st=await docker("GET","/containers/"+id+"/json")}catch(e){last="读取容器状态失败："+String((e&&e.message)||e)}
    if(st){
      const s=st.State||{};
      const health=(s.Health&&s.Health.Status)||"";
      if(s.Running===false) return {ok:false,reason:"新容器已退出（exit "+String(s.ExitCode==null?"?":s.ExitCode)+"）"};
      if(s.Restarting) return {ok:false,reason:"新容器在反复重启（Restarting=true）"};
      if(health==="unhealthy") return {ok:false,reason:"新容器健康检查未通过（unhealthy）"};
      if(health==="healthy") return {ok:true,reason:"健康检查通过"};
      if(!health&&Date.now()>=stableAt) return {ok:true,reason:"已连续运行 "+stableSeconds+" 秒（该镜像没有健康检查）"};
      last=health?("健康检查 "+health):"运行中";
    }
    await new Promise(r=>setTimeout(r,1000));
  }
  return {ok:false,reason:"等了 "+seconds+" 秒仍未就绪（"+last+"）"};
}
(async()=>{
  // 任务优先从环境变量拿（不依赖任何挂载）；兼容旧写法：读 data/.gondi-next.json
  let job=null;
  if(process.env.GONGDI_JOB){
    try{job=JSON.parse(process.env.GONGDI_JOB)}catch(e){throw new Error("更新任务解析失败："+String((e&&e.message)||e))}
  }
  if(!job) job=JSON.parse(fs.readFileSync(nodePath.join(DATA_DIR,".gondi-next.json"),"utf8"));
  if(!job||!job.create) throw new Error("更新任务为空（缺少容器配置）");
  log("更新容器已启动：新镜像 "+String(job.create.Image||"")+"，待替换容器 "+String(job.oldId||"").slice(0,12));
  await new Promise(r=>setTimeout(r,2500));
  const nextName=job.name+"-next";
  try{await docker("DELETE","/containers/"+encodeURIComponent(nextName)+"?force=true")}catch(e){}
  // 先用临时名把新容器创建出来：镜像/挂载/配置有问题会在这一步失败，
  // 此时老容器还活着、业务不中断（原实现先删老容器，创建一失败就直接没服务了）。
  const created=await docker("POST","/containers/create?name="+encodeURIComponent(nextName),job.create);
  log("新容器已创建 "+String(created.Id||"").slice(0,12)+"（临时名 "+nextName+"）");
  // 2) 停老容器（先不删，留着回滚），把端口让出来
  let oldStopped=false;
  try{await docker("POST","/containers/"+job.oldId+"/stop?t=12");oldStopped=true;log("老容器已停止")}catch(e){log("停老容器失败（继续尝试启动新容器）："+String((e&&e.message)||e))}
  // 3) 启动新容器；起不来就把老容器拉回来（回滚），保证业务不中断
  try{
    await docker("POST","/containers/"+created.Id+"/start");
    log("新容器已启动");
  }catch(err){
    try{await docker("DELETE","/containers/"+created.Id+"?force=true")}catch(e){}
    if(oldStopped){try{await docker("POST","/containers/"+job.oldId+"/start")}catch(e){log("回滚启动老容器也失败了")}}
    throw new Error("新容器启动失败，已回滚到原容器："+String((err&&err.message)||err));
  }
  // 4) 就绪校验：确认新容器**确实在服务**，再动老容器与旧镜像。
  //    没有这一步时「start 返回 200」就够删老容器 + 删旧镜像 + 记「更新成功」，
  //    而「起来就退出（数据目录写不了 / 环境变量不对）」或「Running 但没在监听」这两种最常见的坏情况
  //    会让用户看到「更新完成、页面打不开」且回不去 —— 老容器已经删了。
  const ready=await waitReady(created.Id,READY_SECONDS,STABLE_SECONDS);
  if(!ready.ok){
    try{await docker("DELETE","/containers/"+created.Id+"?force=true")}catch(e){}
    if(oldStopped){
      try{await docker("POST","/containers/"+job.oldId+"/start");log("已回滚：老容器 "+job.name+" 仍在运行（数据没动）")}
      catch(e){log("回滚启动老容器也失败了："+String((e&&e.message)||e))}
    }
    throw new Error("新容器未就绪（"+ready.reason+"），已回滚到原容器，本次更新未生效");
  }
  log("新容器已就绪："+ready.reason);
  // 5) 新容器已经在服务：移除老容器，再让新容器接管正式名字
  try{await docker("DELETE","/containers/"+job.oldId+"?force=true")}catch(e){}
  await docker("POST","/containers/"+created.Id+"/rename?name="+encodeURIComponent(job.name));
  log("已接管名称 "+job.name);
  // 6) 顺手清掉上一个版本的镜像：老容器已经删了，这份镜像再没人用，
  //    留着只会让 NAS 每更新一次就多占几百 MB。删错了也不会影响新容器（层是共享的、按引用计数）。
  try{
    const oldImage=job.oldImage||"";
    const newImage=(await docker("GET","/images/"+encodeURIComponent(job.create.Image)+"/json")).Id||"";
    if(oldImage&&(!newImage||oldImage!==newImage)){
      const r=await docker("DELETE","/images/"+encodeURIComponent(oldImage)+"?force=1&noprune=1");
      const mb=Math.round(((r&&r.Size)||0)/1048576);
      log("已清理旧镜像 "+(oldImage+"").slice(0,19)+(mb?"（约 "+mb+" MB）":""));
    }
  }catch(e){
    log("清理旧镜像失败（不影响本次更新）: "+String((e&&e.message)||e));
  }
  log("更新成功，已启动 "+job.name);
  try{fs.unlinkSync(nodePath.join(DATA_DIR,".gondi-next.json"))}catch(e){}
  try{fs.unlinkSync(nodePath.join(DATA_DIR,".gondi-updater.cjs"))}catch(e){}
})().catch(e=>{
  fail(String((e&&e.message)||e));
  process.exit(1);
});
`;
