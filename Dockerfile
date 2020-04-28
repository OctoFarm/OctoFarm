
FROM node:13.0.1-stretch

COPY . /app

WORKDIR /app

RUN chmod +x docker/entrypoint.sh
ENTRYPOINT docker/entrypoint.sh

EXPOSE 4000

CMD pm2 start --no-daemon  processes.json