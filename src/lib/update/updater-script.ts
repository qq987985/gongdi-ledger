/**
 * 更新容器里内联执行的替换脚本（Cmd: ["node","-e",UPDATER_SCRIPT]）。
 * 从 update.server.ts 原样搬出，一个字节都不能动 —— tests/update-script.test.ts 会真解析它。
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
  // 4) 新容器已经在跑：移除老容器，再让新容器接管正式名字
  try{await docker("DELETE","/containers/"+job.oldId+"?force=true")}catch(e){}
  await docker("POST","/containers/"+created.Id+"/rename?name="+encodeURIComponent(job.name));
  log("已接管名称 "+job.name);
  // 5) 顺手清掉上一个版本的镜像：老容器已经删了，这份镜像再没人用，
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
