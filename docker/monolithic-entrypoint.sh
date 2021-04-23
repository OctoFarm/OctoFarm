#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

pwd
ENV MONGO=mongodb://127.0.0.1:27017/octofarm

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

cd /app/

pm2 start app.js --name OctoFarm --no-daemon -o './logs/pm2.log' -e './logs/pm2.error.log' --time
