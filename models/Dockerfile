FROM node:13.0.1-stretch

COPY . /app

WORKDIR /app

RUN npm install -g pm2

RUN chmod +x docker/entrypoint.sh
ENTRYPOINT docker/entrypoint.sh