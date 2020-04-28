#!/bin/sh

if [ -d "node_modules" ] 
then
    echo "Node modules exist, skipping install" 
    echo "Making sure node modules are up to date..."
    npm update
    echo "packages updated..."
    echo "installing pm2 dependancy"
    npm install pm2 -g
else
      echo "Installing node packages"
    npm install
      echo "installing pm2 dependancy"
    npm install pm2 -g
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

if [ -f "serverConfig/server.js" ]
then
    echo "Config already exists"
else
    echo "" > serverConfig/server.js
    tee serverConfig/server.js <<EOF >/dev/null
module.exports = {
  port: 4000,
  registration: true,
  loginRequired: true
};
EOF
fi

if [ -f "serverConfig/timeout.js" ]
then
    echo "Config already exists"
else
    echo "" > serverConfig/timeout.js
    tee serverConfig/timeout.js <<EOF >/dev/null
module.exports = {
    webSocketRetry: 5000,
    apiTimeout: 1000,
    apiRetryCutoff: 10000,
};
EOF
fi



if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

pm2 start app.js --name OctoFarm
