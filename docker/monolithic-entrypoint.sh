#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

pwd
ENV MONGO=mongodb://127.0.0.1:27017/octofarm

sudo systemctl enable mongod

sudo systemctl start mongod

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

pm2 start app.js --name OctoFarm -e ./logs/pm2.error.log -o ./logs/pm2.out.log --time --wait-ready --listen-timeout 10000 --restart-delay=1000 --shutdown-with-message --update-env --exp-backoff-restart-delay=1500
