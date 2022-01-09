#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

pwd
ENV MONGO=mongodb://127.0.0.1:27017/octofarm

wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

sudo apt install mongodb-org

systemctl enable mongod

systemctl start mongod

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

pm2 start app.js --name OctoFarm -e ./logs/pm2.error.log -o ./logs/pm2.out.log --time --wait-ready --listen-timeout 10000 --restart-delay=1000 --shutdown-with-message --update-env --exp-backoff-restart-delay=1500
