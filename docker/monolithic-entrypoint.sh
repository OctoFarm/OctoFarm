#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

pwd
ENV MONGO=mongodb://127.0.0.1:27017/octofarm

if [ -d "../logs" ]
then
    mkdir -p ../logs
else
    echo "Logs folder already exists..."
fi

cd server && pm2 flush && pm2 start ecosystem.config.js
