#!/bin/bash

echo "OctoFarm Client Build: building current client from source"

echo "OctoFarm Client Build: running npm bump"
npm run bump
cd client
echo "OctoFarm Client Build: building client, this may take a while..."
npm run build

echo "OctoFarm Client Build: client built, cd out of client directory and exit"

cd ../