#!/bin/sh

if [ -d "node_modules" ]
then
    echo "Node modules exist, skipping install"
else
    echo "Installing node packages"
    npm ci --production
fi

if [ -z "$MONGO" ]
then
    echo "MONGO is not defined, please define the MongoDB connection with the MONGO environment variable"
    exit 1
fi

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

pm2 start app.js --name OctoFarm --no-daemon -o './logs/pm2.log' -e './logs/pm2.error.log' --time