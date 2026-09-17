FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080
ENV HOST=0.0.0.0
ENV PORT=8080
ENV DATA_DIR=/data
COPY app ./app
COPY VERSION.txt /app/VERSION.txt
RUN mkdir -p /data/accounts /data/books /data/photos/id /data/photos/bank /data/photos/ic /data/photos/报量单 /data/photos/发票 /data/photos/收款回单 /data/photos/考勤影像 /data/photos/合同扫描件 /data/photos/报销凭证 /data/photos/报销打款 /data/photos/保险合同 /data/backups /data/templates
EXPOSE 8080
# 健康检查：给「一键更新」一个「新容器真的在服务」的信号（否则只等于 start 返回 200），
# 也给 docker ps / 飞牛面板一个可读状态。只依赖镜像里已有的 node（无需额外包），
# 端口跟着 PORT / NITRO_PORT 走，用户改端口也能正确探测。
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 CMD ["node","-e","fetch('http://127.0.0.1:'+(process.env.PORT||process.env.NITRO_PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
# 注意结尾的 `exec`：不加的话 PID 1 是 sh，docker stop 的 SIGTERM 到不了 node
# （sh 秒退、node 直接吃 SIGKILL），在飞的整本快照保存被硬中断、也没有收尾日志。
CMD ["sh","-c","mkdir -p /data/accounts /data/books /data/photos/id /data/photos/bank /data/photos/ic /data/photos/报量单 /data/photos/发票 /data/photos/收款回单 /data/photos/考勤影像 /data/photos/合同扫描件 /data/photos/报销凭证 /data/photos/报销打款 /data/photos/保险合同 /data/backups /data/templates && exec node app/server/index.mjs"]
