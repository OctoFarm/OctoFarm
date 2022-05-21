# https://pkgs.alpinelinux.org/packages?name=nodejs&branch=v3.13
# Results in NodeJS 14.17.0
FROM alpine:3.14 as base

RUN apk add --no-cache --virtual .base-deps \
    nodejs \
    npm \
    tini

ENV NODE_ENV=production

RUN npm install -g npm@latest
RUN npm install -g pm2

RUN adduser -D octofarm --home /app && \
    mkdir -p /scripts && \
    chown -R octofarm:octofarm /scripts/

FROM base as compiler

RUN apk add --no-cache --virtual .build-deps \
    alpine-sdk \
    make \
    gcc \
    g++ \
    python3

WORKDIR /tmp/app

COPY server/package.json ./server/package.json
COPY server/package-lock.json ./server/package-lock.json

WORKDIR /tmp/app/server

RUN npm ci --omit=dev

RUN apk del .build-deps

WORKDIR /tmp/app

FROM base as runtime

COPY --chown=octofarm:octofarm --from=compiler /tmp/app/server/node_modules /app/server/node_modules
COPY --chown=octofarm:octofarm . /app

RUN rm -rf /tmp/app

USER octofarm
WORKDIR /app

RUN chmod +x ./docker/entrypoint.sh
ENTRYPOINT [ "/sbin/tini", "--" ]
CMD ["./docker/entrypoint.sh"]