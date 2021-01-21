FROM alpine:3.13 as base

RUN apk add --no-cache --virtual .base-deps \
    nodejs \
    npm \
    tini 

RUN npm install -g pm2

RUN adduser -D octofarm 

ENTRYPOINT [ "/sbin/tini", "--" ]

FROM base as compiler

RUN apk add --no-cache --virtual .build-deps \
    alpine-sdk \
    make \
    gcc \
    g++ \
    python3

WORKDIR /app
COPY package.json .
RUN npm install --only=production

RUN apk del .build-deps

FROM base as runtime

WORKDIR /home/octofarm
COPY --chown=octofarm:octofarm --from=compiler /app/node_modules ./app/node_modules
COPY --chown=octofarm:octofarm . ./app

USER octofarm
WORKDIR /home/octofarm/app

CMD [ "docker/alpine-entrypoint.sh" ]
