#!/bin/sh
mkdir -p /data/db
nohup sh -c mongod --dbpath /data/db &

pwd
echo "" > config/db.js
tee config/db.js <<EOF >/dev/null
module.exports = {
MongoURI: "mongodb://127.0.0.1:27017/octofarm"
};
EOF

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

cd /app/

pm2 start app.js --name OctoFarm --no-daemon -o './logs/pm2.log' -e './logs/pm2.error.log' --time
