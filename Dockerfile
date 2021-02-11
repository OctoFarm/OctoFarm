FROM node:13.0.1-stretch-slim

RUN npm install -g pm2

COPY --chown=node:node . /app

WORKDIR /app

USER node
RUN npm install --only=production

RUN chmod +x docker/entrypoint.sh
ENTRYPOINT docker/entrypoint.sh