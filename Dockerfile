FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=8080
ENV HOST=0.0.0.0
ENV PORT=8080
ENV DATA_DIR=/data
COPY app ./app
RUN mkdir -p /data/accounts /data/books /data/photos/id /data/photos/bank /data/photos/ic /data/photos/报量单 /data/photos/发票 /data/photos/收款回单 /data/photos/考勤影像 /data/backups /data/templates
EXPOSE 8080
CMD ["sh", "-c", "mkdir -p /data/accounts /data/books /data/photos/id /data/photos/bank /data/photos/ic /data/photos/报量单 /data/photos/发票 /data/photos/收款回单 /data/photos/考勤影像 /data/backups /data/templates && node app/server/index.mjs"]
