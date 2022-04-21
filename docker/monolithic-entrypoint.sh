#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

cd server && pm2 flush && pm2 start ecosystem.config.js
