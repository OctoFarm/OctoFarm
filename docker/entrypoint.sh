#!/bin/sh

if [ -d "node_modules" ]
then
    echo "Node modules exist, skipping install"
else
      echo "Installing node packages"
    npm install
fi

if [ -z "$MONGO" ]
then
        echo "MONGO is not defined, please define the server connection"
        exit 1
else
        pwd
        echo "" > config/db.js
        tee config/db.js <<EOF >/dev/null
module.exports = {
MongoURI: "${MONGO}"
};
EOF

fi

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi


cd /app/

pm2 start app.js --name OctoFarm --no-daemon -o './logs/pm2.log' -e './logs/pm2.error.log' --time