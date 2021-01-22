FROM alpine:3.12 as base

RUN apk add --no-cache --virtual .base-deps \
    nodejs \
    npm \
    tini 

RUN npm install -g pm2

RUN adduser -D octofarm 

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

COPY --chown=octofarm:octofarm --from=compiler /app/node_modules /home/octofarm/app/node_modules
COPY --chown=octofarm:octofarm . /home/octofarm/app
RUN rm -rf /app

USER octofarm
WORKDIR /home/octofarm/app

ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "./docker/alpine-entrypoint.sh" ]
