#!/bin/sh

if [ -d "node_modules" ]
then
    echo "Node modules exist, skipping install"
else
    echo "Installing node packages"
    npm ci
fi

if [ -z "$MONGO" ]
then
    echo "MONGO is not defined, please define the MongoDB connection with the MONGO environment variable"
    exit 1
fi

if [ -z "$OCTOFARM_PORT" ]
then
    echo "OCTOFARM_PORT=$OCTOFARM_PORT is not defined, the default of 4000 will be assumed. You can override this at any point."
fi

if [ -d "logs" ]
then
    mkdir -p logs
else
    echo "Logs folder already exists..."
fi

cd server && pm2 flush && pm2 start ecosystem.config.js
